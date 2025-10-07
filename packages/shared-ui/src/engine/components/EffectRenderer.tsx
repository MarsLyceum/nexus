import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Platform } from 'react-native';

import {
    type CanvasSurfaceHandle,
    type CanvasSurfaceSnapshot,
    type SurfaceLayout,
    getCanvasManager,
} from '../canvasManager';
import { useEffectEngine } from '../hooks/useEffectEngine';
import { Backend, EffectDescriptor, EngineState, Timeline } from '../types';

export type EffectRendererProps<State extends EngineState, UniformData> = {
    readonly descriptor: EffectDescriptor<State, UniformData>;
    readonly timeline: Timeline;
    readonly state: Partial<State>;
    readonly backends?: ReadonlyArray<Backend<UniformData>>;
    readonly preferredBackend?: string;
    readonly containerStyle?: React.CSSProperties;
    readonly snapshotStyle?: React.CSSProperties;
    readonly onFailure?: (error: Error) => void;
    readonly onReady?: () => void;
    readonly onBackendChange?: (backend: string | undefined) => void;
    readonly zIndex?: number;
    readonly blendMode?: GlobalCompositeOperation;
    readonly layout?: SurfaceLayout;
};

const SNAPSHOT_BUFFER_COUNT = 3;
const SNAPSHOT_CAPTURE_RETRY_LIMIT = 5;

type SnapshotBuffer = {
    readonly canvas: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D;
};

const createSnapshotBuffers = () =>
    Array.from({ length: SNAPSHOT_BUFFER_COUNT }, () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Failed to create snapshot buffer');
        }
        return { canvas, context } satisfies SnapshotBuffer;
    });

const clampUnit = (value: number): number => {
    if (!Number.isFinite(value)) {
        return 0;
    }
    if (value <= 0) {
        return 0;
    }
    if (value >= 1) {
        return 1;
    }
    return value;
};

const resolveOpacity = (value: React.CSSProperties['opacity']): number => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? clampUnit(value) : 1;
    }
    if (typeof value === 'string') {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? clampUnit(parsed) : 1;
    }
    return 1;
};

type StyleState = {
    readonly visible: boolean;
    readonly opacity: number;
};

const resolveStyleState = (
    style: React.CSSProperties | undefined
): StyleState => {
    if (!style) {
        return { visible: true, opacity: 1 } as const;
    }
    const { display } = style;
    if (display === 'none') {
        return { visible: false, opacity: 0 } as const;
    }
    const { visibility } = style;
    if (visibility === 'hidden' || visibility === 'collapse') {
        return { visible: false, opacity: 0 } as const;
    }
    const opacity = resolveOpacity(style.opacity);
    return { visible: true, opacity } as const;
};

const toPixels = (value: number, dpr: number): number =>
    Math.max(1, Math.floor(Math.max(0, value) * dpr));

const resolveLayoutFromStyle = (
    layout: SurfaceLayout | undefined,
    style: React.CSSProperties | undefined
): SurfaceLayout | undefined => {
    if (layout) {
        return layout;
    }
    if (!style) {
        return undefined;
    }
    const width = typeof style.width === 'number' ? style.width : undefined;
    const height = typeof style.height === 'number' ? style.height : undefined;
    if (width === undefined || height === undefined) {
        return undefined;
    }
    const dpr = globalThis.devicePixelRatio ?? 1;
    return {
        x: 0,
        y: 0,
        width,
        height,
        dpr,
    } satisfies SurfaceLayout;
};

export const EffectRenderer = <State extends EngineState, UniformData>({
    descriptor,
    timeline,
    state,
    backends,
    preferredBackend = 'auto',
    containerStyle,
    snapshotStyle,
    onFailure,
    onReady,
    onBackendChange,
    zIndex = 0,
    blendMode = 'source-over',
    layout,
}: EffectRendererProps<State, UniformData>): React.ReactElement | null => {
    const [engineCanvas, setEngineCanvas] = useState<HTMLCanvasElement | null>(
        null
    );
    const [backendId, setBackendId] = useState<string | undefined>(undefined);
    const [hasInitError, setHasInitError] = useState(false);
    const [activeSnapshotIndex, setActiveSnapshotIndex] = useState<
        number | null
    >(null);
    const [snapshotVisible, setSnapshotVisible] = useState(false);
    const [shouldCaptureSnapshot, setShouldCaptureSnapshot] = useState(false);
    const surfaceHandleRef = useRef<CanvasSurfaceHandle | null>(null);
    const layoutRef = useRef<SurfaceLayout | undefined>(
        resolveLayoutFromStyle(layout, containerStyle)
    );
    const snapshotBuffersRef = useRef<ReadonlyArray<SnapshotBuffer>>([]);
    const lastSnapshotRef = useRef<CanvasSurfaceSnapshot | undefined>(
        undefined
    );
    const lastStableBackendRef = useRef<string | undefined>(undefined);
    const backendActiveRef = useRef(false);
    const snapshotVisibleRef = useRef(false);
    const styleState = useMemo(
        () => resolveStyleState(containerStyle),
        [containerStyle]
    );
    const lastVisibilityStateRef = useRef<string | undefined>(undefined);

    const applySurfaceVisibility = useCallback(() => {
        const handle = surfaceHandleRef.current;
        if (!handle) {
            return;
        }
        const containerVisible = styleState.visible;
        const engineVisible = containerVisible && backendActiveRef.current;
        const snapshotVisibleState =
            containerVisible && snapshotVisibleRef.current;
        const shouldRenderSurface = engineVisible || snapshotVisibleState;
        handle.setVisible(shouldRenderSurface);
        const containerOpacity = containerVisible
            ? clampUnit(styleState.opacity)
            : 0;
        const shouldShowEngine = engineVisible && !snapshotVisibleRef.current;
        handle.setOpacity(shouldShowEngine ? containerOpacity : 0);
        const visibilitySnapshot = JSON.stringify({
            descriptorId: descriptor.id,
            containerVisible,
            backendActive: backendActiveRef.current,
            snapshotVisible: snapshotVisibleRef.current,
            shouldRenderSurface,
            shouldShowEngine,
            containerOpacity,
        });
        if (lastVisibilityStateRef.current !== visibilitySnapshot) {
            lastVisibilityStateRef.current = visibilitySnapshot;
            if (typeof console !== 'undefined') {
                // eslint-disable-next-line no-console
                console.log('[EffectRenderer] visibility update', {
                    descriptorId: descriptor.id,
                    containerVisible,
                    backendActive: backendActiveRef.current,
                    snapshotVisible: snapshotVisibleRef.current,
                    shouldRenderSurface,
                    shouldShowEngine,
                    opacity: shouldShowEngine ? containerOpacity : 0,
                });
            }
        }
    }, [descriptor.id, styleState.opacity, styleState.visible]);

    useEffect(() => {
        if (Platform.OS !== 'web') {
            return undefined;
        }
        const handle = getCanvasManager().registerSurface({
            descriptorId: descriptor.id,
            zIndex,
            blendMode,
        });
        surfaceHandleRef.current = handle;
        layoutRef.current = resolveLayoutFromStyle(layout, containerStyle);
        handle.setLayout(layoutRef.current);
        if (handle.canvas.dataset.effectDescriptorId !== descriptor.id) {
            handle.canvas.dataset.effectDescriptorId = descriptor.id;
        }
        setEngineCanvas(handle.canvas);
        applySurfaceVisibility();
        return () => {
            surfaceHandleRef.current = null;
            snapshotBuffersRef.current = [];
            lastSnapshotRef.current = undefined;
            handle.setSnapshot(undefined);
            handle.dispose();
            setEngineCanvas(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        applySurfaceVisibility,
        blendMode,
        containerStyle,
        descriptor.id,
        layout,
        zIndex,
    ]);

    useEffect(() => {
        const handle = surfaceHandleRef.current;
        if (!handle) {
            return;
        }
        handle.setZIndex(zIndex);
    }, [zIndex]);

    useEffect(() => {
        const handle = surfaceHandleRef.current;
        if (!handle) {
            return;
        }
        handle.setBlendMode(blendMode);
    }, [blendMode]);

    useEffect(() => {
        const handle = surfaceHandleRef.current;
        if (!handle) {
            return;
        }
        layoutRef.current = resolveLayoutFromStyle(layout, containerStyle);
        handle.setLayout(layoutRef.current);
        if (engineCanvas) {
            const { current } = layoutRef;
            if (current) {
                const widthPx = toPixels(current.width, current.dpr);
                const heightPx = toPixels(current.height, current.dpr);
                if (engineCanvas.width !== widthPx) {
                    engineCanvas.width = widthPx;
                }
                if (engineCanvas.height !== heightPx) {
                    engineCanvas.height = heightPx;
                }
                engineCanvas.style.width = `${current.width}px`;
                engineCanvas.style.height = `${current.height}px`;
            }
        }
        applySurfaceVisibility();
    }, [applySurfaceVisibility, containerStyle, engineCanvas, layout]);

    const hideSnapshot = useCallback(() => {
        setSnapshotVisible(false);
        setActiveSnapshotIndex(null);
        lastSnapshotRef.current = undefined;
        surfaceHandleRef.current?.setSnapshot(undefined);
        snapshotVisibleRef.current = false;
        applySurfaceVisibility();
    }, [applySurfaceVisibility]);

    const captureSnapshot = useCallback(() => {
        const handle = surfaceHandleRef.current;
        const canvas = engineCanvas;
        if (!handle || !canvas || canvas.width <= 0 || canvas.height <= 0) {
            return false;
        }
        if (snapshotBuffersRef.current.length === 0) {
            snapshotBuffersRef.current = createSnapshotBuffers();
        }
        const nextIndex =
            activeSnapshotIndex === null
                ? 0
                : (activeSnapshotIndex + 1) % SNAPSHOT_BUFFER_COUNT;
        const { canvas: snapshotCanvas, context } =
            snapshotBuffersRef.current[nextIndex];
        const lastLayout = layoutRef.current;
        if (snapshotCanvas.width !== canvas.width) {
            snapshotCanvas.width = canvas.width;
        }
        if (snapshotCanvas.height !== canvas.height) {
            snapshotCanvas.height = canvas.height;
        }
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.globalCompositeOperation = 'copy';
        context.drawImage(canvas, 0, 0);
        context.globalCompositeOperation = 'source-over';
        const containerOpacity = styleState.visible
            ? resolveOpacity(snapshotStyle?.opacity ?? styleState.opacity)
            : 0;
        const snapshot: CanvasSurfaceSnapshot = {
            canvas: snapshotCanvas,
            opacity: containerOpacity,
        };
        lastSnapshotRef.current = snapshot;
        handle.setSnapshot(snapshot);
        if (lastLayout) {
            handle.setLayout(lastLayout);
        }
        setActiveSnapshotIndex(nextIndex);
        setSnapshotVisible(true);
        snapshotVisibleRef.current = true;
        applySurfaceVisibility();
        return true;
    }, [
        activeSnapshotIndex,
        applySurfaceVisibility,
        engineCanvas,
        snapshotStyle?.opacity,
        styleState.opacity,
        styleState.visible,
    ]);

    const resolvedBackends = useMemo(() => {
        const registry = backends ? [...backends] : descriptor.createBackends();
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
            return 'auto' as const;
        }
        return preferredBackend;
    }, [preferredBackend, resolvedBackends]);

    const handleReady = useCallback(() => {
        hideSnapshot();
        onReady?.();
    }, [hideSnapshot, onReady]);

    const engineResult = useEffectEngine({
        descriptor,
        timeline,
        canvas: engineCanvas,
        state,
        backends: resolvedBackends,
        desiredBackend: normalizedPreferredBackend,
        onBackendChange: (next) => {
            if (!next) {
                const capturedImmediately = captureSnapshot();
                if (!capturedImmediately) {
                    setShouldCaptureSnapshot(true);
                } else if (shouldCaptureSnapshot) {
                    setShouldCaptureSnapshot(false);
                }
                backendActiveRef.current = false;
                applySurfaceVisibility();
            } else {
                setShouldCaptureSnapshot(false);
                backendActiveRef.current = true;
                applySurfaceVisibility();
            }
            if (next && next !== 'auto') {
                setHasInitError(false);
                onBackendChange?.(next);
            }
        },
        onReady: handleReady,
        onError: (error) => {
            setEngineCanvas(null);
            setHasInitError(true);
            onFailure?.(error);
        },
    });

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
                return;
            }
            globalThis.requestAnimationFrame(() => {
                attemptCapture(remainingAttempts - 1);
            });
        };
        attemptCapture(SNAPSHOT_CAPTURE_RETRY_LIMIT);
        return () => {
            cancelled = true;
        };
    }, [captureSnapshot, shouldCaptureSnapshot]);

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

    useEffect(() => {
        backendActiveRef.current = Boolean(engineCanvas);
        applySurfaceVisibility();
    }, [applySurfaceVisibility, engineCanvas]);

    useEffect(() => {
        const handle = surfaceHandleRef.current;
        const { current } = layoutRef;
        if (!handle || !current || !engineCanvas) {
            return;
        }
        const widthPx = toPixels(current.width, current.dpr);
        const heightPx = toPixels(current.height, current.dpr);
        if (engineCanvas.width !== widthPx) {
            engineCanvas.width = widthPx;
        }
        if (engineCanvas.height !== heightPx) {
            engineCanvas.height = heightPx;
        }
        engineCanvas.style.width = `${current.width}px`;
        engineCanvas.style.height = `${current.height}px`;
        handle.setLayout(current);
    }, [engineCanvas]);

    const containerOpacity = snapshotVisible
        ? 1
        : !backendId && !hasInitError
          ? 0
          : 1;

    if (Platform.OS !== 'web' || hasInitError) {
        return null;
    }

    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                overflow: 'visible',
                pointerEvents: 'none',
                zIndex: 0,
                opacity: containerOpacity,
                ...containerStyle,
            }}
        />
    );
};
