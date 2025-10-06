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
    let activeBackend: string | undefined;
    let running = false;
    let disposed = false;
    let frameId: number | undefined;
    let readyEmitted = false;

    const clearActiveHandle = () => {
        if (!activeHandle && !activeBackend) {
            return;
        }

        const handle = activeHandle;
        const previousBackend = activeBackend;
        activeHandle = undefined;
        activeBackend = undefined;

        if (handle) {
            try {
                handle.destroy();
            } catch (error) {
                options.onError?.(toError(error));
            }
        }

        if (previousBackend) {
            options.onBackendChange?.(undefined);
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

    type BackendDiagnosticsEntry = {
        readonly backend: string;
        readonly message: string;
        readonly details?: ReadonlyArray<string>;
    };

    const extractShaderDiagnostics = (
        error: Error
    ): ReadonlyArray<string> | undefined => {
        const diagnostics = (
            error as Error & {
                readonly shaderDiagnostics?: ReadonlyArray<string>;
            }
        ).shaderDiagnostics;
        return Array.isArray(diagnostics) && diagnostics.length > 0
            ? [...diagnostics]
            : undefined;
    };

    const inheritDiagnostics = (
        backendId: string,
        errors: ReadonlyArray<Error>,
        previous: ReadonlyArray<BackendDiagnosticsEntry>
    ): BackendDiagnosticsEntry[] => [
        ...previous,
        ...errors.map((error) => ({
            backend: backendId,
            message: error.message,
            details: extractShaderDiagnostics(error),
        })),
    ];

    const ensureBackend = (
        initialErrors: ReadonlyArray<Error> = [],
        diagnostics: ReadonlyArray<BackendDiagnosticsEntry> = []
    ): Promise<string | undefined> => {
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
            backendOrder.length > 0 ? backendOrder : [...backendMap.keys()];
        if (attemptOrder.length === 0) {
            const failureBackendId = desired ?? 'unavailable';
            activeBackend = undefined;
            options.onBackendChange?.(undefined);
            const aggregatedDiagnostics = inheritDiagnostics(
                failureBackendId,
                initialErrors,
                diagnostics
            );
            aggregatedDiagnostics.forEach((entry) => {
                const detailText = entry.details?.join('\n');
                const message = `Renderer fallback while initializing ${entry.backend} backend: ${entry.message}${
                    detailText ? `\n${detailText}` : ''
                }`;
                const error = new Error(message);
                if (entry.details && entry.details.length > 0) {
                    (
                        error as Error & {
                            details?: ReadonlyArray<string>;
                        }
                    ).details = entry.details;
                }
                options.onError?.(error);
            });
            return Promise.resolve(activeBackend);
        }
        type BackendAttempt = {
            readonly handle: BackendHandle<UniformData> | undefined;
            readonly backendId: string | undefined;
            readonly errors: ReadonlyArray<Error>;
            readonly diagnostics: ReadonlyArray<BackendDiagnosticsEntry>;
        };
        const initialAttempt: BackendAttempt = {
            handle: undefined,
            backendId: undefined,
            errors: initialErrors,
            diagnostics,
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
                                        diagnostics: acc.diagnostics,
                                    }))
                                    .catch((error) => ({
                                        handle: undefined,
                                        backendId: undefined,
                                        errors: [...acc.errors, toError(error)],
                                        diagnostics: inheritDiagnostics(
                                            backendId,
                                            [toError(error)],
                                            acc.diagnostics
                                        ),
                                    }));
                            })
                            .catch((error) => ({
                                handle: undefined,
                                backendId: undefined,
                                errors: [...acc.errors, toError(error)],
                                diagnostics: inheritDiagnostics(
                                    backendId,
                                    [toError(error)],
                                    acc.diagnostics
                                ),
                            }));
                    }),
                Promise.resolve(initialAttempt)
            )
            .then((result: BackendAttempt) => {
                if (!result.handle || !result.backendId) {
                    const failureBackendId =
                        desired ?? attemptOrder[0] ?? 'unavailable';
                    activeBackend = undefined;
                    options.onBackendChange?.(undefined);
                    const aggregatedDiagnostics = inheritDiagnostics(
                        failureBackendId,
                        result.errors,
                        result.diagnostics
                    );
                    aggregatedDiagnostics.forEach((entry) => {
                        const detailText = entry.details?.join('\n');
                        const message = `Renderer fallback while initializing ${entry.backend} backend: ${entry.message}${
                            detailText ? `\n${detailText}` : ''
                        }`;
                        const error = new Error(message);
                        if (entry.details && entry.details.length > 0) {
                            (
                                error as Error & {
                                    details?: ReadonlyArray<string>;
                                }
                            ).details = entry.details;
                        }
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
