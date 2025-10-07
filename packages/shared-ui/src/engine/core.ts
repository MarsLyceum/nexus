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
    const describeCanvas = () => ({
        canvasConnected: options.canvas.isConnected,
        canvasSize: {
            width: options.canvas.width,
            height: options.canvas.height,
            clientWidth: options.canvas.clientWidth,
            clientHeight: options.canvas.clientHeight,
        },
    });

    type CanvasSnapshot = ReturnType<typeof describeCanvas>;

    const withCanvasState = <Payload extends Record<string, unknown>>(
        payload: Payload
    ): Payload & CanvasSnapshot => ({
        ...payload,
        ...describeCanvas(),
    });

    const logEngineEvent = (
        label: string,
        payload: Record<string, unknown> = {}
    ) => {
        console.log(`[engine] ${label}`, withCanvasState(payload));
    };

    const warnEngineEvent = (
        label: string,
        payload: Record<string, unknown> = {}
    ) => {
        console.warn(`[engine] ${label}`, withCanvasState(payload));
    };

    logEngineEvent('createEngine', {
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
    let ensureQueue: Promise<string | undefined> = Promise.resolve(undefined);

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
            logEngineEvent('fatal error on inactive backend', {
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
        readonly cause?: Error;
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
            cause: error,
        })),
    ];

    const acquireBackendSequentially = async (
        initialErrors: ReadonlyArray<Error> = [],
        diagnostics: ReadonlyArray<BackendDiagnosticsEntry> = []
    ): Promise<string | undefined> => {
        if (disposed) {
            return activeBackend;
        }
        const desired = backendOrder[0];
        if (!options.canvas.isConnected) {
            logEngineEvent('ensureBackend aborted, canvas detached', {
                descriptorId: options.canvas.dataset?.effectDescriptorId,
                desired,
            });
            return activeBackend;
        }
        logEngineEvent('ensureBackend', {
            desired,
            activeBackend,
            backendOrder,
            initialErrors: initialErrors.map((error) => error.message),
        });
        if (activeHandle && desired && activeBackend === desired) {
            return activeBackend;
        }
        clearActiveHandle();
        const attemptOrder =
            backendOrder.length > 0 ? backendOrder : [...backendMap.keys()];
        if (attemptOrder.length === 0) {
            const failureBackendId = desired ?? 'unavailable';
            activeBackend = undefined;
            if (!disposed) {
                options.onBackendChange?.(undefined);
                const aggregatedDiagnostics = inheritDiagnostics(
                    failureBackendId,
                    initialErrors,
                    diagnostics
                );
                aggregatedDiagnostics.forEach((entry) => {
                    const detailText = entry.details?.join('\n');
                    const causeText =
                        entry.cause?.stack ?? entry.cause?.message ?? undefined;
                    const messageLines = [
                        `Renderer fallback while initializing ${entry.backend} backend: ${entry.message}`,
                        detailText,
                        causeText,
                    ].filter((line): line is string => Boolean(line));
                    const error = new Error(messageLines.join('\n'));
                    (error as Error & { cause?: Error }).cause = entry.cause;
                    if (entry.details && entry.details.length > 0) {
                        (
                            error as Error & {
                                details?: ReadonlyArray<string>;
                            }
                        ).details = entry.details;
                    }
                    options.onError?.(error);
                });
            }
            return activeBackend;
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
        const canvasDetachedResult = (
            label: string,
            backendId: string,
            acc: BackendAttempt
        ): BackendAttempt => {
            logEngineEvent(label, { backendId });
            return acc;
        };

        const recordBackendFailure = (
            backendId: string,
            error: Error,
            acc: BackendAttempt
        ): BackendAttempt => ({
            handle: undefined,
            backendId: undefined,
            errors: [...acc.errors, error],
            diagnostics: inheritDiagnostics(
                backendId,
                [error],
                acc.diagnostics
            ),
        });

        const attemptBackendCandidate = async (
            acc: BackendAttempt,
            backendId: string
        ): Promise<BackendAttempt> => {
            if (acc.handle || disposed) {
                return acc;
            }
            const backend = backendMap.get(backendId);
            if (!backend) {
                warnEngineEvent('backend missing in map', { backendId });
                return acc;
            }
            if (!options.canvas.isConnected) {
                return canvasDetachedResult(
                    'backend availability skipped, canvas detached',
                    backendId,
                    acc
                );
            }
            let available: boolean;
            try {
                available = await Promise.resolve(backend.isAvailable());
            } catch (error) {
                const normalized = toError(error);
                warnEngineEvent('backend availability check failed', {
                    backendId,
                    error: normalized.message,
                    stack: normalized.stack,
                });
                return recordBackendFailure(backendId, normalized, acc);
            }
            if (disposed) {
                return acc;
            }
            if (!options.canvas.isConnected) {
                return canvasDetachedResult(
                    'backend availability ignored, canvas detached after check',
                    backendId,
                    acc
                );
            }
            logEngineEvent('backend availability', {
                backendId,
                available,
            });
            if (!available) {
                return acc;
            }
            if (!options.canvas.isConnected) {
                return canvasDetachedResult(
                    'backend creation skipped, canvas detached',
                    backendId,
                    acc
                );
            }
            const metrics = options.metrics(state);
            logEngineEvent('backend create invoked', {
                backendId,
                metrics,
            });
            try {
                const handle = await backend.create({
                    canvas: options.canvas,
                    metrics,
                    onFatal: (error) => handleFatal(backendId, error),
                });
                return {
                    handle,
                    backendId,
                    errors: acc.errors,
                    diagnostics: acc.diagnostics,
                };
            } catch (error) {
                const normalized = toError(error);
                return recordBackendFailure(backendId, normalized, acc);
            }
        };

        const finalizeBackendSelection = (
            attempt: BackendAttempt
        ): string | undefined => {
            if (!attempt.handle || !attempt.backendId) {
                const failureBackendId =
                    desired ?? attemptOrder[0] ?? 'unavailable';
                activeBackend = undefined;
                if (!disposed) {
                    options.onBackendChange?.(undefined);
                    const aggregatedDiagnostics = inheritDiagnostics(
                        failureBackendId,
                        attempt.errors,
                        attempt.diagnostics
                    );
                    aggregatedDiagnostics.forEach((entry) => {
                        const detailText = entry.details?.join('\n');
                        const causeText =
                            entry.cause?.stack ??
                            entry.cause?.message ??
                            undefined;
                        const messageLines = [
                            `Renderer fallback while initializing ${entry.backend} backend: ${entry.message}`,
                            detailText,
                            causeText,
                        ].filter((line): line is string => Boolean(line));
                        const error = new Error(messageLines.join('\n'));
                        (error as Error & { cause?: Error }).cause =
                            entry.cause;
                        if (entry.details && entry.details.length > 0) {
                            (
                                error as Error & {
                                    details?: ReadonlyArray<string>;
                                }
                            ).details = entry.details;
                        }
                        options.onError?.(error);
                    });
                }
                return activeBackend;
            }
            activeHandle = attempt.handle;
            if (activeBackend !== attempt.backendId) {
                activeBackend = attempt.backendId;
                logEngineEvent('backend activated', {
                    activeBackend,
                });
                options.onBackendChange?.(attempt.backendId);
                readyEmitted = false;
            }
            return activeBackend;
        };

        const result = await attemptOrder.reduce<Promise<BackendAttempt>>(
            (promise, backendId) =>
                promise.then((acc) => attemptBackendCandidate(acc, backendId)),
            Promise.resolve(initialAttempt)
        );
        if (disposed) {
            return activeBackend;
        }
        return finalizeBackendSelection(result);
    };

    const ensureBackend = (
        initialErrors: ReadonlyArray<Error> = [],
        diagnostics: ReadonlyArray<BackendDiagnosticsEntry> = []
    ): Promise<string | undefined> => {
        ensureQueue = ensureQueue
            .catch(() => undefined)
            .then(() => acquireBackendSequentially(initialErrors, diagnostics));
        return ensureQueue;
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
