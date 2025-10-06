import { createEngine } from './core';
import {
    Backend,
    EffectDescriptor,
    EngineControl,
    EngineState,
    Timeline,
} from './types';

export type EffectEngineOptions<State extends EngineState, UniformData> = {
    readonly canvas: HTMLCanvasElement;
    readonly timeline: Timeline;
    readonly descriptor: EffectDescriptor<State, UniformData>;
    readonly initialState?: State;
    readonly backends?: ReadonlyArray<Backend<UniformData>>;
    readonly backendPreference?: ReadonlyArray<string>;
    readonly onBackendChange?: (backend: string | undefined) => void;
    readonly onReady?: () => void;
    readonly onError?: (error: Error) => void;
};

const selectArray = <Value>(
    overrideValue: ReadonlyArray<Value> | undefined,
    fallback: ReadonlyArray<Value> | undefined,
    defaultValue: ReadonlyArray<Value>
): ReadonlyArray<Value> => {
    if (overrideValue && overrideValue.length > 0) {
        return overrideValue;
    }
    if (fallback && fallback.length > 0) {
        return fallback;
    }
    return defaultValue;
};

export const createEffectEngine = <State extends EngineState, UniformData>(
    options: EffectEngineOptions<State, UniformData>
): EngineControl<State> => {
    const backends =
        options.backends ??
        options.descriptor.createBackends().map((backend) => {
            if (backend.id !== 'webgpu') {
                return backend;
            }
            return {
                ...backend,
                create: async (context) => {
                    const handle = await backend.create(context);
                    return {
                        ...handle,
                        destroy: () => {
                            const typedCanvas = context.canvas;
                            typedCanvas.width = 0;
                            typedCanvas.height = 0;
                            handle.destroy();
                        },
                    };
                },
            };
        });
    const gpuFirstPreference = (() => {
        const descriptorPreference = options.descriptor.backendPreference;
        if (!descriptorPreference || descriptorPreference.length === 0) {
            return [
                'webgpu',
                'webgl',
                ...backends.map((backend) => backend.id),
            ];
        }
        return descriptorPreference;
    })();
    const backendPreference = selectArray(
        options.backendPreference,
        gpuFirstPreference,
        backends.map((backend) => backend.id)
    );
    console.log('[effectSystem] createEffectEngine', {
        descriptorId: options.descriptor.id,
        backends: backends.map((backend) => backend.id),
        backendPreference,
    });
    const initialState =
        options.initialState ?? options.descriptor.initialState;
    return createEngine<State, UniformData>({
        canvas: options.canvas,
        timeline: options.timeline,
        initialState,
        metrics: options.descriptor.metrics,
        computeUniforms: options.descriptor.computeUniforms,
        backends,
        backendPreference,
        onBackendChange: options.onBackendChange,
        onReady: options.onReady,
        onError: options.onError,
    });
};

export type EffectRegistry = {
    readonly register: <State extends EngineState, UniformData>(
        descriptor: EffectDescriptor<State, UniformData>
    ) => EffectRegistry;
    readonly get: <State extends EngineState, UniformData>(
        effectId: string
    ) => EffectDescriptor<State, UniformData> | undefined;
    readonly list: () => ReadonlyArray<EffectDescriptor<EngineState, unknown>>;
    readonly has: (effectId: string) => boolean;
};

export const createEffectRegistry = (
    initial: ReadonlyArray<EffectDescriptor<EngineState, unknown>> = []
): EffectRegistry => {
    const byId = new Map<string, EffectDescriptor<EngineState, unknown>>(
        initial.map((descriptor) => [descriptor.id, descriptor])
    );

    const register = <State extends EngineState, UniformData>(
        descriptor: EffectDescriptor<State, UniformData>
    ): EffectRegistry => {
        const newById = new Map(byId);
        newById.set(
            descriptor.id,
            descriptor as EffectDescriptor<EngineState, unknown>
        );
        return createEffectRegistry([...newById.values()]);
    };

    const get = <State extends EngineState, UniformData>(
        effectId: string
    ): EffectDescriptor<State, UniformData> | undefined => {
        const descriptor = byId.get(effectId);
        return descriptor as EffectDescriptor<State, UniformData> | undefined;
    };

    const list = () => [...byId.values()];

    const has = (effectId: string) => byId.has(effectId);

    return { register, get, list, has };
};

export const globalEffectRegistry = createEffectRegistry();

export const registerEffect = <State extends EngineState, UniformData>(
    descriptor: EffectDescriptor<State, UniformData>
): void => {
    const existing = globalEffectRegistry.get(descriptor.id);
    if (existing) {
        throw new Error(
            `Effect "${descriptor.id}" is already registered. Use a unique id.`
        );
    }
    Object.assign(
        globalEffectRegistry,
        globalEffectRegistry.register(descriptor)
    );
};

export const getEffect = <
    State extends EngineState = EngineState,
    UniformData = unknown,
>(
    effectId: string
): EffectDescriptor<State, UniformData> | undefined =>
    globalEffectRegistry.get<State, UniformData>(effectId);

export const listEffects = (): ReadonlyArray<
    EffectDescriptor<EngineState, unknown>
> => globalEffectRegistry.list();
