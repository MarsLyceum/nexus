import { getCanvasManager } from './canvasManager';
import { createEffectEngine } from './effectSystem';
import {
    type Backend,
    type CanvasSurfaceHandle,
    type EffectDescriptor,
    type EngineState,
    type Timeline,
} from './types';
import { mergeState } from './utils';

type EngineListener = {
    readonly onBackendChange?: (backend: string | undefined) => void;
    readonly onReady?: () => void;
    readonly onError?: (error: Error) => void;
};

type EngineManagerEntry = {
    readonly descriptorId: string;
    readonly handle: CanvasSurfaceHandle;
    readonly listeners: Map<string, EngineListener>;
    readonly updateState: (state: Partial<EngineState>) => void;
    readonly setDesiredBackend: (
        backend: string | 'auto'
    ) => Promise<string | undefined>;
    readonly start: () => void;
    readonly stop: () => void;
    readonly getActiveBackend: () => string | undefined;
    readonly clearSnapshot: () => void;
    readonly setVisibility: (visible: boolean) => void;
    state: EngineState;
    desiredBackend: string | 'auto';
    backendId: string | undefined;
    refCount: number;
};

type EngineGroup = {
    readonly id: string;
    readonly entries: Map<string, EngineManagerEntry>;
    groupZIndex: number;
};

const createEngineGroup = (id: string, groupZIndex: number): EngineGroup => ({
    id,
    entries: new Map<string, EngineManagerEntry>(),
    groupZIndex,
});

const ensureEngineGroup = (
    groups: Map<string, EngineGroup>,
    id: string,
    groupZIndex: number
) => {
    const existing = groups.get(id);
    if (existing) {
        existing.groupZIndex = groupZIndex;
        return existing;
    }
    const created = createEngineGroup(id, groupZIndex);
    groups.set(id, created);
    return created;
};

const applyGroupZIndex = (group: EngineGroup) => {
    group.entries.forEach((entry) => {
        entry.handle.setGroupZIndex(group.groupZIndex);
    });
};

type AttachOptions<State extends EngineState, UniformData> = {
    readonly descriptor: EffectDescriptor<State, UniformData>;
    readonly timeline: Timeline;
    readonly state: Partial<State>;
    readonly backends?: ReadonlyArray<Backend<UniformData>>;
    readonly desiredBackend: string | 'auto';
    readonly zIndex: number;
    readonly groupId?: string;
    readonly groupZIndex?: number;
    readonly blendMode: GlobalCompositeOperation;
    readonly onBackendChange?: (backend: string | undefined) => void;
    readonly onReady?: () => void;
    readonly onError?: (error: Error) => void;
};

export type EngineManagerSession<State extends EngineState> = {
    readonly handle: CanvasSurfaceHandle;
    readonly backendId: string | undefined;
    readonly setDesiredBackend: (
        backend: string | 'auto'
    ) => Promise<string | undefined>;
    readonly updateState: (state: Partial<State>) => void;
    readonly release: () => void;
};

const hasEntries = (value: Partial<EngineState>): boolean =>
    Object.keys(value).some(() => true);

const collectListeners = <Key extends keyof EngineListener>(
    entry: EngineManagerEntry,
    selector: (listener: EngineListener) => EngineListener[Key] | undefined
) =>
    Array.from(entry.listeners.values())
        .map(selector)
        .filter((callback): callback is NonNullable<EngineListener[Key]> =>
            Boolean(callback)
        );

const notifyBackendChange = (
    entry: EngineManagerEntry,
    backend: string | undefined
) => {
    entry.backendId = backend;
    collectListeners(entry, (listener) => listener.onBackendChange).forEach(
        (callback) => callback(backend)
    );
};

const notifyReady = (entry: EngineManagerEntry) => {
    collectListeners(entry, (listener) => listener.onReady).forEach(
        (callback) => callback()
    );
};

const notifyError = (entry: EngineManagerEntry, error: Error) => {
    collectListeners(entry, (listener) => listener.onError).forEach(
        (callback) => callback(error)
    );
};

const resolveBackends = <UniformData>(
    descriptor: EffectDescriptor<EngineState, UniformData>,
    overrides?: ReadonlyArray<Backend<UniformData>>
) =>
    overrides && overrides.length > 0 ? overrides : descriptor.createBackends();

const createEntry = <State extends EngineState, UniformData>(
    options: AttachOptions<State, UniformData>
): EngineManagerEntry => {
    const manager = getCanvasManager();
    const handle = manager.registerSurface({
        descriptorId: options.descriptor.id,
        groupId: options.groupId,
        groupZIndex: options.groupZIndex,
        zIndex: options.zIndex,
        blendMode: options.blendMode,
    });

    const listeners = new Map<string, EngineListener>();
    const resolvedBackends = resolveBackends(
        options.descriptor,
        options.backends
    );
    let currentState = mergeState<State>(
        options.descriptor.initialState,
        options.state
    );
    let entry: EngineManagerEntry;

    const engine = createEffectEngine<State, UniformData>({
        canvas: handle.canvas,
        timeline: options.timeline,
        descriptor: options.descriptor,
        backends: resolvedBackends,
        backendPreference:
            options.desiredBackend === 'auto'
                ? undefined
                : [options.desiredBackend],
        onBackendChange: (backend) => notifyBackendChange(entry, backend),
        onReady: () => notifyReady(entry),
        onError: (error) => notifyError(entry, error),
    });

    const updateState = (patch: Partial<EngineState>) => {
        if (!hasEntries(patch)) {
            return;
        }
        currentState = mergeState<State>(currentState, patch as Partial<State>);
        entry.state = currentState;
        engine.update(patch as Partial<State>);
    };

    const setDesiredBackend = (backend: string | 'auto') => {
        entry.desiredBackend = backend;
        return engine.setDesiredBackend(backend);
    };

    entry = {
        descriptorId: options.descriptor.id,
        handle,
        listeners,
        updateState,
        setDesiredBackend,
        start: () => {
            engine.start();
        },
        stop: () => {
            engine.stop();
        },
        getActiveBackend: () => engine.getActiveBackend(),
        clearSnapshot: () => {
            handle.setSnapshot(undefined);
        },
        setVisibility: (visible: boolean) => {
            handle.setVisible(visible);
            handle.setOpacity(visible ? 1 : 0);
        },
        state: currentState,
        desiredBackend: options.desiredBackend,
        backendId: engine.getActiveBackend(),
        refCount: 0,
    } satisfies EngineManagerEntry;

    if (hasEntries(options.state)) {
        engine.update(options.state);
    }
    engine.start();

    if (handle.canvas.dataset.effectDescriptorId !== options.descriptor.id) {
        handle.canvas.dataset.effectDescriptorId = options.descriptor.id;
    }

    return entry;
};

const createEngineManager = () => {
    const groups = new Map<string, EngineGroup>();

    const attach = <State extends EngineState, UniformData>(
        options: AttachOptions<State, UniformData>
    ): EngineManagerSession<State> => {
        const desiredBackend = options.desiredBackend;
        const groupKey = options.groupId
            ? `${options.groupId}`
            : options.descriptor.id;
        const resolvedGroupZIndex = options.groupZIndex ?? 0;
        const group = ensureEngineGroup(groups, groupKey, resolvedGroupZIndex);
        const entry = createEntry(options);
        const entryKey = entry.handle.id;
        group.entries.set(entryKey, entry);
        applyGroupZIndex(group);

        entry.handle.setBlendMode(options.blendMode);
        entry.handle.setZIndex(options.zIndex);

        const sessionId = crypto.randomUUID();
        entry.listeners.set(sessionId, {
            onBackendChange: options.onBackendChange,
            onReady: options.onReady,
            onError: options.onError,
        });

        entry.refCount += 1;
        entry.setVisibility(true);
        entry.desiredBackend = desiredBackend;
        entry.updateState(options.state);
        void entry.setDesiredBackend(desiredBackend);
        entry.start();

        let released = false;

        return {
            handle: entry.handle,
            backendId: entry.backendId,
            setDesiredBackend: (backend) => entry.setDesiredBackend(backend),
            updateState: (statePatch) => entry.updateState(statePatch),
            release: () => {
                if (released) {
                    return;
                }
                released = true;
                entry.listeners.delete(sessionId);
                entry.refCount = Math.max(0, entry.refCount - 1);
                if (entry.refCount > 0) {
                    return;
                }
                entry.clearSnapshot();
                entry.setVisibility(false);
                entry.stop();
                entry.backendId = entry.getActiveBackend();
                entry.listeners.clear();
                const targetGroup = groups.get(groupKey);
                targetGroup?.entries.delete(entryKey);
                if (targetGroup && targetGroup.entries.size === 0) {
                    groups.delete(groupKey);
                }
                entry.handle.dispose();
            },
        } satisfies EngineManagerSession<State>;
    };

    return { attach } as const;
};

let singleton: ReturnType<typeof createEngineManager> | undefined;

export const getEngineManager = () => {
    if (!singleton) {
        singleton = createEngineManager();
    }
    return singleton;
};
