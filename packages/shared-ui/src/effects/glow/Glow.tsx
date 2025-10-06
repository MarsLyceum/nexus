import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Platform } from 'react-native';

import { glowEffectDescriptor } from './glowConfig';
import { WEBGPU_GLOW_OUTER_PAD_PX } from './glowSpec';
import { clampFocal } from '../../utils/geometry';
import { useAnimationTimeline } from '../../animation/timeline';
import { EffectRendererWithMetrics } from '../../engine/components/EffectRendererWithMetrics';
import {
    createGlowKeyframes,
    createWebGlowAnimationStyle,
} from '../../utils/animatedGlow';
import { hasWebGL, hasWebGPU } from '../../engine';

export type GlowBackend = 'webgpu' | 'webgl' | 'css' | 'auto';

export type GlowDiagnostics = {
    readonly failedBackends: ReadonlyArray<string>;
    readonly backendErrors: Record<string, Error>;
    readonly attemptedBackends: ReadonlyArray<string>;
};

export type GlowStatus = 'initializing' | 'ready' | 'failed' | 'rendering';

export type GlowProps = {
    readonly color: string;
    readonly borderRadius?: number;
    readonly focal?: { readonly x: number; readonly y: number };
    readonly opacity?: number;
    readonly animate?: boolean;
    readonly preferredBackend?: GlowBackend;
    readonly padding?: number;
    readonly enableCssFallback?: boolean;
    readonly fillContainer?: boolean; // If false, uses width/height props
    readonly width?: number | string;
    readonly height?: number | string;
    readonly onFailure?: (error: Error, backend: string) => void;
    readonly onReady?: () => void;
    readonly onBackendChange?: (backend: string) => void;
    readonly onStatusChange?: (status: GlowStatus) => void;
    readonly onDiagnosticsChange?: (diagnostics: GlowDiagnostics) => void;
};

const selectBackendPreference = (
    preferred: GlowBackend,
    webgpuAvailable: boolean,
    webglAvailable: boolean
): 'webgpu' | 'webgl' | 'css' => {
    if (preferred === 'webgpu' && webgpuAvailable) {
        return 'webgpu';
    }
    if (preferred === 'webgl' && webglAvailable) {
        return 'webgl';
    }
    if (preferred === 'css') {
        return 'css';
    }
    if (preferred === 'auto') {
        if (webgpuAvailable) {
            return 'webgpu';
        }
        if (webglAvailable) {
            return 'webgl';
        }
        return 'css';
    }
    if (webglAvailable) {
        return 'webgl';
    }
    if (webgpuAvailable) {
        return 'webgpu';
    }
    return 'css';
};

export const Glow: React.FC<GlowProps> = ({
    color,
    borderRadius = 0,
    focal = { x: 0.5, y: 0.4 },
    opacity = 1,
    animate = true,
    preferredBackend = 'auto',
    padding = WEBGPU_GLOW_OUTER_PAD_PX,
    enableCssFallback = true,
    fillContainer = true,
    width,
    height,
    onFailure,
    onReady,
    onBackendChange,
    onStatusChange,
    onDiagnosticsChange,
}) => {
    const timeline = useAnimationTimeline();
    const normalizedFocal = useMemo(() => clampFocal(focal), [focal]);
    const isWeb = Platform.OS === 'web';

    const webgpuAvailable = useMemo(() => isWeb && hasWebGPU(), [isWeb]);
    const webglAvailable = useMemo(() => isWeb && hasWebGL(), [isWeb]);

    const initialBackend = useMemo(
        () =>
            selectBackendPreference(
                preferredBackend,
                webgpuAvailable,
                webglAvailable
            ),
        [preferredBackend, webglAvailable, webgpuAvailable]
    );

    const [activeBackend, setActiveBackend] = useState<
        'webgpu' | 'webgl' | 'css'
    >(initialBackend);
    const [status, setStatus] = useState<GlowStatus>('initializing');
    const [diagnostics, setDiagnostics] = useState<GlowDiagnostics>({
        failedBackends: [],
        backendErrors: {},
        attemptedBackends: [initialBackend],
    });
    const [cssStartTime, setCssStartTime] = useState(() =>
        timeline.getTimeSeconds()
    );

    const failedBackendsRef = useRef<Set<string>>(new Set());
    const gpuRenderingFailed = useRef(false);

    const updateDiagnostics = useCallback((backend: string, error?: Error) => {
        setDiagnostics((current) => {
            const nextFailedBackends = error
                ? [...current.failedBackends, backend].filter(
                      (value, index, array) => array.indexOf(value) === index
                  )
                : current.failedBackends;

            const nextBackendErrors = error
                ? { ...current.backendErrors, [backend]: error }
                : current.backendErrors;

            const nextAttempted = current.attemptedBackends.includes(backend)
                ? current.attemptedBackends
                : [...current.attemptedBackends, backend];

            return {
                failedBackends: nextFailedBackends,
                backendErrors: nextBackendErrors,
                attemptedBackends: nextAttempted,
            };
        });
    }, []);

    const handleGpuFailure = useCallback(
        (error: Error) => {
            const currentBackend = activeBackend;
            if (typeof console !== 'undefined') {
                // eslint-disable-next-line no-console
                console.error(
                    `[Glow] ${currentBackend} rendering failed:`,
                    error
                );
            }

            failedBackendsRef.current.add(currentBackend);
            updateDiagnostics(currentBackend, error);
            onFailure?.(error, currentBackend);

            // Try to find an alternative GPU backend that hasn't failed
            let nextGpuBackend: 'webgpu' | 'webgl' | null = null;

            if (
                currentBackend === 'webgl' &&
                webgpuAvailable &&
                !failedBackendsRef.current.has('webgpu')
            ) {
                nextGpuBackend = 'webgpu';
            } else if (
                currentBackend === 'webgpu' &&
                webglAvailable &&
                !failedBackendsRef.current.has('webgl')
            ) {
                nextGpuBackend = 'webgl';
            }

            if (nextGpuBackend) {
                // Try the alternative GPU backend
                if (typeof console !== 'undefined') {
                    // eslint-disable-next-line no-console
                    console.log(
                        `[Glow] Attempting fallback to ${nextGpuBackend}`
                    );
                }
                setActiveBackend(nextGpuBackend);
                setStatus('initializing');
            } else if (enableCssFallback) {
                // All GPU backends have failed, fall back to CSS
                if (typeof console !== 'undefined') {
                    // eslint-disable-next-line no-console
                    console.log(
                        '[Glow] All GPU backends failed, falling back to CSS'
                    );
                }
                gpuRenderingFailed.current = true;
                setActiveBackend('css');
                setStatus('failed');
            } else {
                gpuRenderingFailed.current = true;
                setStatus('failed');
            }
        },
        [
            activeBackend,
            enableCssFallback,
            onFailure,
            updateDiagnostics,
            webglAvailable,
            webgpuAvailable,
        ]
    );

    const handleGpuReady = useCallback(() => {
        if (typeof console !== 'undefined') {
            // eslint-disable-next-line no-console
            console.log(`[Glow] ${activeBackend} ready`);
        }
        setStatus('ready');
        onReady?.();
    }, [activeBackend, onReady]);

    const handleGpuBackendChange = useCallback(
        (backend: string) => {
            if (typeof console !== 'undefined') {
                // eslint-disable-next-line no-console
                console.log('[Glow] GPU backend changed to', backend);
            }
            updateDiagnostics(backend);
            onBackendChange?.(backend);
        },
        [onBackendChange, updateDiagnostics]
    );

    useEffect(() => {
        const resolvedBackend = selectBackendPreference(
            preferredBackend,
            webgpuAvailable,
            webglAvailable
        );

        // If user explicitly selected this backend (not 'auto'), clear its failed status
        // to give it a fresh try
        if (
            preferredBackend !== 'auto' &&
            preferredBackend === resolvedBackend
        ) {
            failedBackendsRef.current.delete(resolvedBackend);
        }

        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        if (failedBackendsRef.current.has(resolvedBackend)) {
            if (enableCssFallback) {
                setActiveBackend('css');
            }
        } else {
            // Add a small delay when switching to allow proper cleanup
            timeoutId = setTimeout(() => {
                setActiveBackend(resolvedBackend);
            }, 50);
        }

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [enableCssFallback, preferredBackend, webglAvailable, webgpuAvailable]);

    useEffect(() => {
        onBackendChange?.(activeBackend);
    }, [activeBackend, onBackendChange]);

    useEffect(() => {
        onStatusChange?.(status);
    }, [onStatusChange, status]);

    useEffect(() => {
        onDiagnosticsChange?.(diagnostics);
    }, [diagnostics, onDiagnosticsChange]);

    const state = useMemo(
        () => ({
            color,
            borderRadius,
            focal: normalizedFocal,
            opacity,
            animate,
        }),
        [animate, borderRadius, color, normalizedFocal, opacity]
    );

    const keyframes = useMemo(
        () =>
            isWeb ? createGlowKeyframes(color, { focal: normalizedFocal }) : '',
        [color, isWeb, normalizedFocal]
    );

    const shouldRenderCss = useMemo(
        () =>
            activeBackend === 'css' ||
            (gpuRenderingFailed.current && enableCssFallback),
        [activeBackend, enableCssFallback]
    );

    const shouldRenderGpu = useMemo(
        () => isWeb && activeBackend !== 'css' && !gpuRenderingFailed.current,
        [activeBackend, isWeb]
    );

    const cssAnimationStyle = useMemo(
        () => createWebGlowAnimationStyle(cssStartTime),
        [cssStartTime]
    );

    // Update CSS start time when switching to CSS mode
    useEffect(() => {
        if (shouldRenderCss) {
            setCssStartTime(timeline.getTimeSeconds());
        }
    }, [shouldRenderCss, timeline]);

    if (!isWeb) {
        return null;
    }

    const containerStyle = fillContainer
        ? {
              position: 'absolute' as const,
              inset: 0,
              width: '100%',
              height: '100%',
          }
        : {
              position: 'relative' as const,
              width: width ?? '100%',
              height: height ?? '100%',
          };

    return (
        <>
            {Boolean(keyframes) && shouldRenderCss && (
                <style>{keyframes}</style>
            )}
            {shouldRenderCss && (
                <div
                    style={{
                        ...containerStyle,
                        borderRadius: `${borderRadius}px`,
                        pointerEvents: 'none',
                        opacity,
                        ...cssAnimationStyle.style,
                    }}
                />
            )}
            {shouldRenderGpu && (
                <EffectRendererWithMetrics
                    key={`glow-renderer-${activeBackend}`}
                    descriptor={glowEffectDescriptor}
                    timeline={timeline}
                    state={state}
                    preferredBackend={activeBackend}
                    padding={padding}
                    borderRadius={borderRadius}
                    sizing="viewport"
                    canvasStyle={{
                        mixBlendMode: 'plus-lighter',
                        ...containerStyle,
                    }}
                    onFailure={handleGpuFailure}
                    onReady={handleGpuReady}
                    onBackendChange={handleGpuBackendChange}
                />
            )}
        </>
    );
};
