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
    let desiredBackend: string | undefined;
    let state = mergeState(options.initialState, {});
    let activeHandle: BackendHandle<UniformData> | undefined;
    let activeBackend: string | undefined;
    let running = false;
    let disposed = false;
    let frameId: number | undefined;
    let readyEmitted = false;
    let activationQueue: Promise<string | undefined> =
        Promise.resolve(undefined);

    const resolveDesiredBackendId = (): string | undefined =>
        desiredBackend ?? backendOrder[0];

    const isCanvasConnected = () => {
        if (options.canvas.isConnected) {
            return true;
        }
        warnEngineEvent('backend activation aborted, canvas detached', {
            descriptorId: options.canvas.dataset?.effectDescriptorId,
        });
        return false;
    };

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
        const normalized = toError(error);
        warnEngineEvent('fatal error reported', {
            backendId,
            activeBackend,
            error: normalized.message,
        });
        options.onError?.(normalized);
        if (activeBackend !== backendId) {
            return;
        }
        clearActiveHandle();
    };

    const activateBackend = (): Promise<string | undefined> => {
        activationQueue = activationQueue
            .catch(() => undefined)
            .then(async () => {
                if (disposed) {
                    return activeBackend;
                }

                const target = resolveDesiredBackendId();
                if (!target) {
                    clearActiveHandle();
                    return undefined;
                }

                if (!isCanvasConnected()) {
                    return activeBackend;
                }

                if (activeHandle && activeBackend === target) {
                    return activeBackend;
                }

                clearActiveHandle();

                const backend = backendMap.get(target);
                if (!backend) {
                    warnEngineEvent('backend missing in map', {
                        backendId: target,
                    });
                    options.onError?.(
                        new Error(`Backend "${target}" is not registered.`)
                    );
                    return undefined;
                }

                try {
                    const available = await Promise.resolve(
                        backend.isAvailable()
                    );

                    if (!available) {
                        warnEngineEvent('backend reported unavailable', {
                            backendId: target,
                        });
                        return undefined;
                    }

                    if (!isCanvasConnected()) {
                        return activeBackend;
                    }

                    const metrics = options.metrics(state);
                    logEngineEvent('backend create invoked', {
                        backendId: target,
                        metrics,
                    });

                    const handle = await backend.create({
                        canvas: options.canvas,
                        metrics,
                        onFatal: (error) => handleFatal(target, error),
                    });

                    if (disposed) {
                        handle.destroy();
                        return activeBackend;
                    }

                    activeHandle = handle;
                    if (activeBackend !== target) {
                        activeBackend = target;
                        logEngineEvent('backend activated', {
                            activeBackend,
                        });
                        options.onBackendChange?.(target);
                        readyEmitted = false;
                    }

                    return activeBackend;
                } catch (error) {
                    const normalized = toError(error);
                    warnEngineEvent('backend activation failed', {
                        backendId: target,
                        error: normalized.message,
                    });
                    clearActiveHandle();
                    return undefined;
                }
            });

        return activationQueue;
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
        void activateBackend();
        scheduleFrame();
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

    const setDesiredBackend = (backend: string | undefined) => {
        desiredBackend = backend;
        const updatedPreference = backend
            ? [backend, ...defaultOrder]
            : defaultOrder;
        backendOrder = buildBackendOrder(availableBackends, updatedPreference);
        console.log('[engine] setDesiredBackend', {
            backend,
            backendOrder,
        });
        readyEmitted = false;
        return activateBackend();
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
