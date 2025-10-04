import {
    BackendHandle,
    EngineControl,
    EngineOptions,
    EngineState,
} from './types';
import {
    toError,
    mergeState,
    buildBackendOrder,
    scheduleNextFrame,
    cancelScheduledFrame,
} from './utils';

export const createEngine = <State extends EngineState, UniformData>(
    options: EngineOptions<State, UniformData>
): EngineControl<State> => {
    const availableBackends = options.backends ?? [];
    const backendMap = new Map(
        availableBackends.map((backend) => [backend.id, backend])
    );
    const defaultOrder = buildBackendOrder(
        availableBackends,
        options.backendPreference
    );
    console.log('[engine] createEngine', {
        availableBackendIds: availableBackends.map((backend) => backend.id),
        backendPreference: options.backendPreference,
        defaultOrder,
    });
    let backendOrder = defaultOrder;
    let state = mergeState(options.initialState, {});
    let activeHandle: BackendHandle<UniformData> | undefined;
    let activeBackend = 'unknown';
    let running = false;
    let disposed = false;
    let frameId: number | undefined;
    let readyEmitted = false;

    const clearActiveHandle = () => {
        if (activeHandle) {
            try {
                activeHandle.destroy();
            } catch (error) {
                options.onError?.(toError(error));
            }
        }
        activeHandle = undefined;
        if (activeBackend !== 'unknown') {
            activeBackend = 'unknown';
            console.log('[engine] backend reset to unknown');
            options.onBackendChange?.('unknown');
        }
    };

    const handleFatal = (backendId: string, error: Error) => {
        if (disposed) {
            return;
        }
        if (activeBackend !== backendId) {
            console.log('[engine] fatal error on inactive backend', {
                backendId,
                activeBackend,
            });
            options.onError?.(toError(error));
            return;
        }
        const normalized = toError(error);
        options.onError?.(normalized);
        clearActiveHandle();
        void ensureBackend([normalized]);
    };

    const ensureBackend = (
        initialErrors: ReadonlyArray<Error> = []
    ): Promise<string> => {
        if (disposed) {
            return Promise.resolve(activeBackend);
        }
        const desired = backendOrder[0];
        console.log('[engine] ensureBackend', {
            desired,
            activeBackend,
            backendOrder,
            initialErrors,
        });
        if (activeHandle && desired && activeBackend === desired) {
            return Promise.resolve(activeBackend);
        }
        clearActiveHandle();
        const attemptOrder =
            backendOrder.length > 0
                ? backendOrder
                : Array.from(backendMap.keys());
        if (attemptOrder.length === 0) {
            activeBackend = 'none';
            options.onBackendChange?.('none');
            initialErrors.forEach((error) => options.onError?.(error));
            return Promise.resolve(activeBackend);
        }
        type BackendAttempt = {
            readonly handle: BackendHandle<UniformData> | undefined;
            readonly backendId: string | undefined;
            readonly errors: ReadonlyArray<Error>;
        };
        const initialAttempt: BackendAttempt = {
            handle: undefined,
            backendId: undefined,
            errors: initialErrors,
        };
        return attemptOrder
            .reduce<Promise<BackendAttempt>>(
                (promise, backendId) =>
                    promise.then((acc: BackendAttempt) => {
                        if (acc.handle) {
                            return acc;
                        }
                        const backend = backendMap.get(backendId);
                        if (!backend) {
                            console.log('[engine] backend missing in map', {
                                backendId,
                            });
                            return acc;
                        }
                        return Promise.resolve(backend.isAvailable())
                            .then((available) => {
                                console.log('[engine] backend availability', {
                                    backendId,
                                    available,
                                });
                                if (!available) {
                                    return acc;
                                }
                                return backend
                                    .create({
                                        canvas: options.canvas,
                                        metrics: options.metrics(state),
                                        onFatal: (error) =>
                                            handleFatal(backendId, error),
                                    })
                                    .then((handle) => ({
                                        handle,
                                        backendId,
                                        errors: acc.errors,
                                    }))
                                    .catch((error) => ({
                                        handle: undefined,
                                        backendId: undefined,
                                        errors: [...acc.errors, toError(error)],
                                    }));
                            })
                            .catch((error) => ({
                                handle: undefined,
                                backendId: undefined,
                                errors: [...acc.errors, toError(error)],
                            }));
                    }),
                Promise.resolve(initialAttempt)
            )
            .then((result: BackendAttempt) => {
                if (!result.handle || !result.backendId) {
                    activeBackend = 'none';
                    options.onBackendChange?.('none');
                    result.errors.forEach((error: Error) => {
                        options.onError?.(error);
                    });
                    return activeBackend;
                }
                activeHandle = result.handle;
                if (activeBackend !== result.backendId) {
                    activeBackend = result.backendId;
                    console.log('[engine] backend activated', {
                        activeBackend,
                    });
                    options.onBackendChange?.(result.backendId);
                    readyEmitted = false;
                }
                return activeBackend;
            });
    };

    const scheduleFrame = () => {
        if (disposed || !running) {
            return;
        }
        frameId = scheduleNextFrame(renderFrame);
    };

    const emitReadyOnce = () => {
        if (readyEmitted) {
            return;
        }
        readyEmitted = true;
        options.onReady?.();
    };

    const renderFrame: FrameRequestCallback = () => {
        if (disposed || !running) {
            return;
        }
        const handle = activeHandle;
        if (!handle) {
            scheduleFrame();
            return;
        }
        const metrics = options.metrics(state);
        if (metrics.width <= 0 || metrics.height <= 0 || metrics.dpr <= 0) {
            scheduleFrame();
            return;
        }
        try {
            const uniformData = options.computeUniforms({
                state,
                time: options.timeline.getTimeSeconds(),
            });
            handle.renderFrame({
                metrics,
                uniformData,
            });
            emitReadyOnce();
        } catch (error) {
            options.onError?.(toError(error));
        }
        scheduleFrame();
    };

    const start = () => {
        if (disposed || running) {
            return;
        }
        running = true;
        readyEmitted = false;
        console.log('[engine] start invoked');
        void ensureBackend().then(() => {
            scheduleFrame();
        });
    };

    const stop = () => {
        if (!running) {
            return;
        }
        running = false;
        if (frameId !== undefined) {
            cancelScheduledFrame(frameId);
            frameId = undefined;
        }
    };

    const dispose = () => {
        if (disposed) {
            return;
        }
        console.log('[engine] dispose invoked');
        stop();
        disposed = true;
        clearActiveHandle();
    };

    const setDesiredBackend = (backend: string) => {
        const preference =
            backend === 'auto' ? defaultOrder : [backend, ...defaultOrder];
        backendOrder = buildBackendOrder(availableBackends, preference);
        console.log('[engine] setDesiredBackend', {
            backend,
            preference,
            backendOrder,
        });
        readyEmitted = false;
        return ensureBackend();
    };

    const update = (partial: Partial<State>) => {
        state = mergeState(state, partial);
        console.log('[engine] state updated');
    };

    const getActiveBackend = () => activeBackend;

    return {
        update,
        start,
        stop,
        dispose,
        setDesiredBackend,
        getActiveBackend,
    };
};
