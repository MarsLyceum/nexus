import type { StoreApi } from 'zustand';

export type RendererBackend = string;

export type RendererStatus = 'initializing' | 'ready' | 'failed' | 'rendering';

export type RendererDiagnostics = {
    readonly failedBackends: ReadonlyArray<RendererBackend>;
    readonly backendErrors: Record<RendererBackend, Error>;
    readonly attemptedBackends: ReadonlyArray<RendererBackend>;
};

export type RendererControlAvailability<
    Backend extends RendererBackend = RendererBackend,
> = Record<Backend, boolean>;

export type StateSetter<Value> = (
    update: Value | ((current: Value) => Value)
) => void;

export type RendererControlSliceState<
    Backend extends RendererBackend = RendererBackend,
> = {
    readonly availability: RendererControlAvailability<Backend>;
    readonly preferredBackend: Backend | 'auto';
    readonly activeBackend: Backend | 'auto';
    readonly status: RendererStatus;
    readonly diagnostics: RendererDiagnostics;
    readonly rendererLocked: boolean;
    readonly allowAuto: boolean;
    readonly hasHydrated: boolean;
};

export type RendererControlSliceActions<
    Backend extends RendererBackend = RendererBackend,
> = {
    readonly setBackend: (backend: Backend | 'auto') => void;
    readonly setPreferredBackend: StateSetter<Backend | 'auto'>;
    readonly setActiveBackend: StateSetter<Backend | 'auto'>;
    readonly setStatus: StateSetter<RendererStatus>;
    readonly setDiagnostics: StateSetter<RendererDiagnostics>;
    readonly setRendererLocked: StateSetter<boolean>;
    readonly isBackendAvailable: (backend: Backend) => boolean;
};

export type RendererControlSlice<
    Backend extends RendererBackend = RendererBackend,
> = RendererControlSliceState<Backend> & RendererControlSliceActions<Backend>;

const isUpdater = <Value>(
    update: Value | ((current: Value) => Value)
): update is (current: Value) => Value => typeof update === 'function';

const evaluateUpdate = <Value>(
    update: Value | ((current: Value) => Value),
    current: Value
): Value => (isUpdater(update) ? update(current) : update);

export const createDefaultDiagnostics = (): RendererDiagnostics => ({
    failedBackends: [],
    backendErrors: {},
    attemptedBackends: [],
});

export const findFirstAvailable = <Backend extends RendererBackend>(
    availability: RendererControlAvailability<Backend>
): Backend | null =>
    (Object.entries(availability) as Array<[Backend, boolean]>).find(
        ([, isAvailable]) => isAvailable
    )?.[0] ?? null;

export const resolveBackendCandidate = <Backend extends RendererBackend>(
    candidate: Backend | 'auto' | undefined,
    availability: RendererControlAvailability<Backend>,
    allowAuto: boolean,
    firstAvailable: Backend | null,
    fallback: Backend | 'auto'
): Backend | 'auto' => {
    if (candidate === undefined) {
        if (allowAuto) {
            return 'auto';
        }
        if (firstAvailable) {
            return firstAvailable;
        }
        return fallback;
    }
    if (candidate === 'auto') {
        if (allowAuto) {
            return 'auto';
        }
        if (firstAvailable) {
            return firstAvailable;
        }
        if (fallback !== 'auto') {
            return fallback;
        }
        return candidate;
    }
    if (availability[candidate]) {
        return candidate;
    }
    if (allowAuto) {
        return 'auto';
    }
    if (firstAvailable) {
        return firstAvailable;
    }
    if (fallback !== 'auto') {
        return fallback;
    }
    return candidate;
};

export const areAvailabilityMapsEqual = <Backend extends RendererBackend>(
    previous: RendererControlAvailability<Backend>,
    next: RendererControlAvailability<Backend>
) => {
    const nextEntries = Object.entries(next) as Array<[Backend, boolean]>;
    const previousKeys = Object.keys(previous);
    if (previousKeys.length !== nextEntries.length) {
        return false;
    }
    return nextEntries.every(([backend, isAvailable]) => {
        const previousAvailability = previous[backend];
        return previousAvailability === isAvailable;
    });
};

const createInitialRendererState = <
    Backend extends RendererBackend,
>(): RendererControlSliceState<Backend> => ({
    availability: {} as RendererControlAvailability<Backend>,
    preferredBackend: 'auto',
    activeBackend: 'auto',
    status: 'initializing',
    diagnostics: createDefaultDiagnostics(),
    rendererLocked: true,
    allowAuto: true,
    hasHydrated: false,
});

const applyPreferredBackendUpdate =
    <
        Store extends RendererControlSlice<Backend>,
        Backend extends RendererBackend,
    >(
        update:
            | Backend
            | 'auto'
            | ((current: Backend | 'auto') => Backend | 'auto')
    ) =>
    (state: Store): Store => {
        const next = evaluateUpdate(update, state.preferredBackend);
        if (next === state.preferredBackend) {
            return state;
        }
        return {
            ...state,
            preferredBackend: next,
        };
    };

const applyActiveBackendUpdate =
    <
        Store extends RendererControlSlice<Backend>,
        Backend extends RendererBackend,
    >(
        update:
            | Backend
            | 'auto'
            | ((current: Backend | 'auto') => Backend | 'auto')
    ) =>
    (state: Store): Store => {
        const next = evaluateUpdate(update, state.activeBackend);
        if (next === state.activeBackend) {
            return state;
        }
        return {
            ...state,
            activeBackend: next,
        };
    };

const applyStatusUpdate =
    <
        Store extends RendererControlSlice<Backend>,
        Backend extends RendererBackend,
    >(
        update: RendererStatus | ((current: RendererStatus) => RendererStatus)
    ) =>
    (state: Store): Store => {
        const next = evaluateUpdate(update, state.status);
        if (next === state.status) {
            return state;
        }
        return {
            ...state,
            status: next,
        };
    };

const applyDiagnosticsUpdate =
    <
        Store extends RendererControlSlice<Backend>,
        Backend extends RendererBackend,
    >(
        update:
            | RendererDiagnostics
            | ((current: RendererDiagnostics) => RendererDiagnostics)
    ) =>
    (state: Store): Store => {
        const next = evaluateUpdate(update, state.diagnostics);
        if (next === state.diagnostics) {
            return state;
        }
        return {
            ...state,
            diagnostics: next,
        };
    };

const applyRendererLockedUpdate =
    <
        Store extends RendererControlSlice<Backend>,
        Backend extends RendererBackend,
    >(
        update: boolean | ((current: boolean) => boolean)
    ) =>
    (state: Store): Store => {
        const next = evaluateUpdate(update, state.rendererLocked);
        if (next === state.rendererLocked) {
            return state;
        }
        return {
            ...state,
            rendererLocked: next,
        };
    };

const resolveBackendSelection = <Backend extends RendererBackend>(
    backend: Backend | 'auto',
    store: RendererControlSliceState<Backend>
): RendererControlSliceState<Backend> => {
    if (backend === 'auto') {
        if (!store.allowAuto || store.preferredBackend === 'auto') {
            return store;
        }
        return {
            ...store,
            preferredBackend: 'auto',
        };
    }
    if (!store.availability[backend] || store.preferredBackend === backend) {
        return store;
    }
    return {
        ...store,
        preferredBackend: backend,
    };
};

export const createRendererControlSlice = <
    Store extends RendererControlSlice<Backend>,
    Backend extends RendererBackend = RendererBackend,
>(
    set: StoreApi<Store>['setState'],
    get: StoreApi<Store>['getState'],
    store: StoreApi<Store>
): RendererControlSlice<Backend> => ({
    ...createInitialRendererState<Backend>(),
    setBackend: (backend) => {
        set((state) => {
            const nextState = resolveBackendSelection(backend, state);
            if (nextState !== state) {
                // eslint-disable-next-line no-console
                console.log('[rendererControlSlice] setBackend', {
                    requested: backend,
                    previousPreferred: state.preferredBackend,
                    nextPreferred: nextState.preferredBackend,
                    rendererLocked: state.rendererLocked,
                });
            }
            return nextState;
        });
    },
    setPreferredBackend: (update) => {
        set(applyPreferredBackendUpdate<Store, Backend>(update));
    },
    setActiveBackend: (update) => {
        set((state) => {
            const next = applyActiveBackendUpdate<Store, Backend>(update)(
                state
            );
            if (next !== state) {
                // eslint-disable-next-line no-console
                console.log('[rendererControlSlice] setActiveBackend', {
                    previousActive: state.activeBackend,
                    nextActive: next.activeBackend,
                    rendererLocked: state.rendererLocked,
                    allowAuto: state.allowAuto,
                });
            }
            return next;
        });
    },
    setStatus: (update) => {
        set(applyStatusUpdate<Store, Backend>(update));
    },
    setDiagnostics: (update) => {
        set(applyDiagnosticsUpdate<Store, Backend>(update));
    },
    setRendererLocked: (update) => {
        set((state) => {
            const next = applyRendererLockedUpdate<Store, Backend>(update)(
                state
            );
            if (next !== state) {
                // eslint-disable-next-line no-console
                console.log('[rendererControlSlice] setRendererLocked', {
                    previous: state.rendererLocked,
                    next: next.rendererLocked,
                    preferredBackend: next.preferredBackend,
                    activeBackend: next.activeBackend,
                });
            }
            return next;
        });
    },
    isBackendAvailable: (backend) =>
        Boolean(store.getState().availability[backend]),
});

export type RendererControlSliceFactory<
    Store extends RendererControlSlice<Backend>,
    Backend extends RendererBackend = RendererBackend,
> = (
    set: StoreApi<Store>['setState'],
    get: StoreApi<Store>['getState'],
    api: StoreApi<Store>
) => RendererControlSlice<Backend>;
