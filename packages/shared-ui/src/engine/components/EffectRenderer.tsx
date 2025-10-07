import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Platform } from 'react-native';

import { useEffectEngine } from '../hooks/useEffectEngine';
import { Backend, EffectDescriptor, EngineState, Timeline } from '../types';

export type EffectRendererProps<State extends EngineState, UniformData> = {
    readonly descriptor: EffectDescriptor<State, UniformData>;
    readonly timeline: Timeline;
    readonly state: Partial<State>;
    readonly backends?: ReadonlyArray<Backend<UniformData>>;
    readonly preferredBackend?: string;
    readonly containerStyle?: React.CSSProperties;
    readonly canvasStyle?: React.CSSProperties;
    readonly onFailure?: (error: Error) => void;
    readonly onReady?: () => void;
    readonly onBackendChange?: (backend: string | undefined) => void;
};

const SNAPSHOT_BUFFER_COUNT = 3;
const SNAPSHOT_CAPTURE_RETRY_LIMIT = 5;
type TimeoutHandle = ReturnType<typeof globalThis.setTimeout>;

type SnapshotResolution = {
    readonly canvas: HTMLCanvasElement | null;
    readonly viaFallback: boolean;
};

const resolveSnapshotCanvas = (
    refs: ReadonlyArray<React.RefObject<HTMLCanvasElement>>,
    index: number,
    parentElement: Element | null,
    parentMetrics: { readonly width: number; readonly height: number }
): SnapshotResolution => {
    const refCanvas = refs[index]?.current ?? null;
    if (refCanvas) {
        return { canvas: refCanvas, viaFallback: false };
    }
    if (!parentElement) {
        return { canvas: null, viaFallback: false };
    }
    const fallback = parentElement.querySelector(
        `canvas[data-effect-snapshot-index="${index}"]`
    );
    if (fallback instanceof HTMLCanvasElement) {
        return { canvas: fallback, viaFallback: true };
    }
    if (parentMetrics.width > 0 && parentMetrics.height > 0) {
        const candidate = document.createElement('canvas');
        candidate.dataset.effectSnapshotIndex = String(index);
        candidate.style.position = 'absolute';
        candidate.style.top = '0';
        candidate.style.right = '0';
        candidate.style.bottom = '0';
        candidate.style.left = '0';
        candidate.style.width = '100%';
        candidate.style.height = '100%';
        candidate.style.display = 'block';
        candidate.style.pointerEvents = 'none';
        candidate.style.opacity = '0';
        candidate.style.transition = 'opacity 80ms ease-out';
        parentElement?.appendChild(candidate);
        return { canvas: candidate, viaFallback: true };
    }
    return { canvas: null, viaFallback: false };
};

export const EffectRenderer = <State extends EngineState, UniformData>({
    descriptor,
    timeline,
    state,
    backends,
    preferredBackend = 'auto',
    containerStyle,
    canvasStyle,
    onFailure,
    onReady,
    onBackendChange,
}: EffectRendererProps<State, UniformData>): React.ReactElement | null => {
    const [canvasElement, setCanvasElement] =
        useState<HTMLCanvasElement | null>(null);
    const [canvasEpoch, setCanvasEpoch] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const pendingCanvasClearRef = useRef<TimeoutHandle | null>(null);

    const commitCanvasElement = useCallback(
        (element: HTMLCanvasElement | null) => {
            setCanvasElement((current) => {
                if (current === element) {
                    return current;
                }
                if (typeof console !== 'undefined') {
                    // eslint-disable-next-line no-console
                    console.log('[EffectRenderer] commitCanvasElement', {
                        descriptorId: descriptor.id,
                        nextCanvasDefined: Boolean(element),
                        previousCanvasDefined: Boolean(current),
                    });
                }
                if (current && !element) {
                    setCanvasEpoch((value) => value + 1);
                }
                return element;
            });
        },
        [descriptor.id]
    );

    const cancelPendingCanvasClear = useCallback(() => {
        const handle = pendingCanvasClearRef.current;
        if (!handle) {
            return;
        }
        globalThis.clearTimeout(handle);
        pendingCanvasClearRef.current = null;
    }, []);

    const scheduleCanvasClear = useCallback(() => {
        if (typeof globalThis.setTimeout !== 'function') {
            canvasRef.current = null;
            commitCanvasElement(null);
            return;
        }
        const handle = globalThis.setTimeout(() => {
            pendingCanvasClearRef.current = null;
            canvasRef.current = null;
            commitCanvasElement(null);
        }, 0);
        pendingCanvasClearRef.current = handle;
        if (typeof console !== 'undefined') {
            // eslint-disable-next-line no-console
            console.log('[EffectRenderer] scheduleCanvasClear', {
                descriptorId: descriptor.id,
            });
        }
    }, [commitCanvasElement]);

    useEffect(() => cancelPendingCanvasClear, [cancelPendingCanvasClear]);

    const resetCanvasElement = useCallback(() => {
        cancelPendingCanvasClear();
        canvasRef.current = null;
        commitCanvasElement(null);
        if (typeof console !== 'undefined') {
            // eslint-disable-next-line no-console
            console.log('[EffectRenderer] resetCanvasElement', {
                descriptorId: descriptor.id,
            });
        }
    }, [cancelPendingCanvasClear, commitCanvasElement]);

    const registerCanvas = useCallback(
        (element: HTMLCanvasElement | null) => {
            cancelPendingCanvasClear();
            if (element) {
                if (canvasRef.current === element) {
                    return;
                }
                canvasRef.current = element;
                commitCanvasElement(element);
                if (typeof console !== 'undefined') {
                    // eslint-disable-next-line no-console
                    console.log('[EffectRenderer] registerCanvas', {
                        descriptorId: descriptor.id,
                        width: element.width,
                        height: element.height,
                        clientWidth: element.clientWidth,
                        clientHeight: element.clientHeight,
                    });
                }
                return;
            }
            scheduleCanvasClear();
        },
        [
            cancelPendingCanvasClear,
            commitCanvasElement,
            descriptor.id,
            scheduleCanvasClear,
        ]
    );
    const [backendId, setBackendId] = useState<string | undefined>(undefined);
    const [hasInitError, setHasInitError] = useState(false);
    const snapshotRefs = useRef<
        ReadonlyArray<React.RefObject<HTMLCanvasElement>>
    >([]);
    if (snapshotRefs.current.length === 0) {
        snapshotRefs.current = Array.from(
            { length: SNAPSHOT_BUFFER_COUNT },
            () => React.createRef<HTMLCanvasElement>()
        );
    }
    const [activeSnapshotIndex, setActiveSnapshotIndex] = useState<
        number | null
    >(null);
    const [snapshotVisible, setSnapshotVisible] = useState(false);
    const [shouldCaptureSnapshot, setShouldCaptureSnapshot] = useState(false);
    const lastStableBackendRef = useRef<string | undefined>(undefined);

    const hideSnapshot = useCallback(() => {
        if (typeof console !== 'undefined') {
            // eslint-disable-next-line no-console
            console.log('[EffectRenderer] hideSnapshot invoked', {
                descriptorId: descriptor.id,
            });
        }
        setSnapshotVisible(false);
        setActiveSnapshotIndex(null);
    }, [descriptor.id]);

    const captureSnapshot = useCallback(() => {
        if (!canvasElement) {
            if (typeof console !== 'undefined') {
                // eslint-disable-next-line no-console
                console.log('[EffectRenderer] snapshot skipped, no canvas', {
                    descriptorId: descriptor.id,
                });
            }
            return false;
        }
        const nextIndex =
            activeSnapshotIndex === null
                ? 0
                : (activeSnapshotIndex + 1) % SNAPSHOT_BUFFER_COUNT;
        const parentElement = canvasElement.parentElement;
        const { canvas: snapshotCanvas, viaFallback } = resolveSnapshotCanvas(
            snapshotRefs.current,
            nextIndex,
            parentElement,
            {
                width: parentElement?.clientWidth ?? 0,
                height: parentElement?.clientHeight ?? 0,
            }
        );
        if (viaFallback) {
            const targetRef = snapshotRefs.current[nextIndex];
            if (targetRef) {
                targetRef.current = snapshotCanvas;
            }
        }
        if (!snapshotCanvas) {
            if (typeof console !== 'undefined') {
                // eslint-disable-next-line no-console
                console.log('[EffectRenderer] snapshot canvas unavailable', {
                    descriptorId: descriptor.id,
                    nextIndex,
                    parentDefined: Boolean(parentElement),
                    parentWidth: parentElement?.clientWidth ?? 0,
                    parentHeight: parentElement?.clientHeight ?? 0,
                });
            }
            return false;
        }
        const width = canvasElement.width;
        const height = canvasElement.height;
        if (width <= 0 || height <= 0) {
            if (typeof console !== 'undefined') {
                // eslint-disable-next-line no-console
                console.warn('[EffectRenderer] snapshot skipped due to size', {
                    descriptorId: descriptor.id,
                    width,
                    height,
                });
            }
            return false;
        }
        if (snapshotCanvas.width !== width) {
            snapshotCanvas.width = width;
        }
        if (snapshotCanvas.height !== height) {
            snapshotCanvas.height = height;
        }
        const context = snapshotCanvas.getContext('2d');
        if (!context) {
            if (typeof console !== 'undefined') {
                // eslint-disable-next-line no-console
                console.warn('[EffectRenderer] snapshot context unavailable', {
                    descriptorId: descriptor.id,
                    nextIndex,
                });
            }
            return false;
        }
        context.clearRect(0, 0, width, height);
        context.globalCompositeOperation = 'copy';
        context.drawImage(canvasElement, 0, 0, width, height);
        context.globalCompositeOperation = 'source-over';
        setActiveSnapshotIndex(nextIndex);
        setSnapshotVisible(true);
        if (typeof console !== 'undefined') {
            // eslint-disable-next-line no-console
            console.log('[EffectRenderer] snapshot captured', {
                descriptorId: descriptor.id,
                nextIndex,
                width,
                height,
            });
        }
        return true;
    }, [activeSnapshotIndex, canvasElement, descriptor.id]);

    const resolvedBackends = useMemo(() => {
        const registry = backends ? [...backends] : descriptor.createBackends();
        const ids = registry.map((backend) => backend.id);
        if (typeof console !== 'undefined') {
            // eslint-disable-next-line no-console
            console.log('[EffectRenderer] resolved backend ids', {
                descriptorId: descriptor.id,
                ids,
            });
        }
        return registry;
    }, [backends, descriptor]);

    const normalizedPreferredBackend = useMemo(() => {
        if (!preferredBackend || preferredBackend === 'auto') {
            return 'auto' as const;
        }
        const availableBackendIds = new Set(
            resolvedBackends.map((backend) => backend.id)
        );
        if (!availableBackendIds.has(preferredBackend)) {
            if (typeof console !== 'undefined') {
                // eslint-disable-next-line no-console
                console.log('[EffectRenderer] preferred backend unavailable', {
                    descriptorId: descriptor.id,
                    preferredBackend,
                    availableBackendIds: [...availableBackendIds],
                });
            }
            return 'auto' as const;
        }
        return preferredBackend;
    }, [descriptor.id, preferredBackend, resolvedBackends]);

    const baseCanvasStyle = useMemo<React.CSSProperties>(
        () => ({ ...canvasStyle }),
        [canvasStyle]
    );

    const handleReady = useCallback(() => {
        hideSnapshot();
        onReady?.();
    }, [hideSnapshot, onReady]);

    const engineResult = useEffectEngine({
        descriptor,
        timeline,
        canvas: canvasElement,
        state,
        backends: resolvedBackends,
        desiredBackend: normalizedPreferredBackend,
        onBackendChange: (next) => {
            console.log('[EffectRenderer] onBackendChange callback', {
                descriptorId: descriptor.id,
                next,
                HTMLElementWidth: canvasElement?.parentElement?.clientWidth,
                HTMLElementHeight: canvasElement?.parentElement?.clientHeight,
                snapshotVisible,
                activeSnapshotIndex,
            });
            if (!next) {
                const capturedImmediately = captureSnapshot();
                if (!capturedImmediately) {
                    setShouldCaptureSnapshot(true);
                } else if (shouldCaptureSnapshot) {
                    setShouldCaptureSnapshot(false);
                }
                resetCanvasElement();
            } else if (shouldCaptureSnapshot) {
                setShouldCaptureSnapshot(false);
            }
            if (next === 'auto') {
                console.log(
                    '[EffectRenderer] ignoring synthetic auto backend',
                    {
                        descriptorId: descriptor.id,
                    }
                );
                return;
            }
            if (next) {
                setHasInitError(false);
            }
            onBackendChange?.(next);
        },
        onReady: handleReady,
        onError: (error) => {
            resetCanvasElement();
            setHasInitError(true);
            onFailure?.(error);
        },
    });

    useEffect(() => {
        console.log('[EffectRenderer] engine result backend change', {
            descriptorId: descriptor.id,
            engineBackendId: engineResult.backendId,
        });
    }, [engineResult.backendId, descriptor.id]);

    useEffect(() => {
        if (typeof console !== 'undefined') {
            // eslint-disable-next-line no-console
            console.log('[EffectRenderer] snapshot visibility updated', {
                descriptorId: descriptor.id,
                snapshotVisible,
                activeSnapshotIndex,
            });
        }
    }, [activeSnapshotIndex, descriptor.id, snapshotVisible]);

    useEffect(() => {
        if (hasInitError) {
            console.warn('[EffectRenderer] backend state updated with error', {
                descriptorId: descriptor.id,
                backendId,
                hasInitError,
            });
        } else {
            console.log('[EffectRenderer] backend state updated', {
                descriptorId: descriptor.id,
                backendId,
                hasInitError,
            });
        }
    }, [backendId, hasInitError, descriptor.id]);

    useEffect(() => {
        if (!shouldCaptureSnapshot) {
            return;
        }
        let cancelled = false;
        const attemptCapture = (remainingAttempts: number): void => {
            if (cancelled) {
                return;
            }
            const wasCaptured = captureSnapshot();
            if (wasCaptured) {
                setShouldCaptureSnapshot(false);
                return;
            }
            if (remainingAttempts <= 0) {
                setShouldCaptureSnapshot(false);
                if (typeof console !== 'undefined') {
                    // eslint-disable-next-line no-console
                    console.warn(
                        '[EffectRenderer] failed to capture snapshot',
                        {
                            descriptorId: descriptor.id,
                        }
                    );
                }
                return;
            }
            requestAnimationFrame(() => attemptCapture(remainingAttempts - 1));
        };
        attemptCapture(SNAPSHOT_CAPTURE_RETRY_LIMIT);
        return () => {
            cancelled = true;
        };
    }, [captureSnapshot, descriptor.id, shouldCaptureSnapshot]);

    useEffect(() => {
        if (Platform.OS !== 'web') {
            return;
        }
        const nextBackend = engineResult.backendId;
        setBackendId((current) => {
            if (!nextBackend) {
                return current ?? lastStableBackendRef.current;
            }
            if (current !== nextBackend) {
                lastStableBackendRef.current = nextBackend;
            }
            return nextBackend;
        });
    }, [engineResult.backendId]);

    if (Platform.OS !== 'web') {
        console.log(
            '[EffectRenderer] non-web platform detected, rendering null',
            {
                descriptorId: descriptor.id,
            }
        );
        return null;
    }

    if (hasInitError) {
        console.log('[EffectRenderer] backend unavailable, returning null', {
            descriptorId: descriptor.id,
            backendId,
            hasInitError,
            snapshotVisible,
            activeSnapshotIndex,
        });
        return null;
    }

    const containerOpacity = snapshotVisible
        ? 1
        : !backendId && !hasInitError
          ? 0
          : 1;

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                overflow: 'visible',
                pointerEvents: 'none',
                zIndex: 0,
                opacity: containerOpacity,
                ...containerStyle,
            }}
        >
            {snapshotRefs.current.map((ref, index) => (
                <canvas
                    key={`snapshot-${index}`}
                    ref={ref}
                    data-effect-snapshot-index={index}
                    style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        ...baseCanvasStyle,
                        display: 'block',
                        opacity:
                            snapshotVisible && activeSnapshotIndex === index
                                ? 1
                                : 0,
                        transition: 'opacity 80ms ease-out',
                        pointerEvents: 'none',
                    }}
                />
            ))}
            <canvas
                key={`effect-canvas-${canvasEpoch}`}
                ref={registerCanvas}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    opacity: snapshotVisible ? 0 : 1,
                    ...baseCanvasStyle,
                }}
            />
        </div>
    );
};
