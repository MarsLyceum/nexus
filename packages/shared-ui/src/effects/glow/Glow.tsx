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
import {
    useNexusStore,
    type RendererDiagnostics,
    type RendererStatus,
} from '../../store';
import { toError } from '../../engine/utils';

export type GlowBackend = 'webgpu' | 'webgl' | 'css' | 'auto';

export type GlowDiagnostics = RendererDiagnostics;

export type GlowStatus = RendererStatus;

export type GlowFallbackBehavior = 'adaptive' | 'locked';

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
    readonly sizing?: 'container' | 'viewport';
    readonly width?: number | string;
    readonly height?: number | string;
    readonly fallbackBehavior?: GlowFallbackBehavior;
    readonly onFailure?: (error: Error, backend: string) => void;
    readonly onReady?: () => void;
    readonly onBackendChange?: (backend: string) => void;
    readonly onStatusChange?: (status: GlowStatus) => void;
    readonly onDiagnosticsChange?: (diagnostics: GlowDiagnostics) => void;
};

const GPU_SNAPSHOT_PERSIST_MS = 120;

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
    sizing = 'viewport',
    width,
    height,
    fallbackBehavior = 'adaptive',
    onFailure,
    onReady,
    onBackendChange,
    onStatusChange,
    onDiagnosticsChange,
}) => {
    const timeline = useAnimationTimeline();
    const normalizedFocal = useMemo(() => clampFocal(focal), [focal]);
    const isWeb = Platform.OS === 'web';

    const setActiveBackend = useNexusStore(
        ({ setActiveBackend: setStoreActiveBackend }) => setStoreActiveBackend
    );
    const setStatus = useNexusStore(
        ({ setStatus: setStoreStatus }) => setStoreStatus
    );
    const setDiagnostics = useNexusStore(
        ({ setDiagnostics: setStoreDiagnostics }) => setStoreDiagnostics
    );
    const diagnostics = useNexusStore(
        ({ diagnostics: storeDiagnostics }) => storeDiagnostics
    );
    const status = useNexusStore(({ status: storeStatus }) => storeStatus);
    const activeBackend = useNexusStore(
        ({ activeBackend: storeActiveBackend }) => storeActiveBackend
    );
    const availability = useNexusStore(
        ({ availability: storeAvailability }) => storeAvailability
    );
    const rendererLocked = useNexusStore(
        ({ rendererLocked: storeRendererLocked }) => storeRendererLocked
    );
    const [cssStartTime, setCssStartTime] = useState(() =>
        timeline.getTimeSeconds()
    );

    const failedBackendsRef = useRef<Set<string>>(new Set());
    const gpuRenderingFailed = useRef(false);
    const availabilitySnapshot = useMemo(
        () => ({
            webgpu: Boolean(availability.webgpu ?? false),
            webgl: Boolean(availability.webgl ?? false),
            css: true,
        }),
        [availability.webgl, availability.webgpu]
    );

    const webgpuAvailable = availabilitySnapshot.webgpu && isWeb;
    const webglAvailable = availabilitySnapshot.webgl && isWeb;

    const fallbackMode = useMemo<GlowFallbackBehavior>(
        () => (rendererLocked ? 'locked' : fallbackBehavior),
        [fallbackBehavior, rendererLocked]
    );

    useEffect(() => {
        if (availabilitySnapshot.webgpu || availabilitySnapshot.webgl) {
            return;
        }
        setActiveBackend('css');
        setStatus('failed');
    }, [
        availabilitySnapshot.webgl,
        availabilitySnapshot.webgpu,
        setActiveBackend,
        setStatus,
    ]);

    const lastGpuBackendRef = useRef<'webgpu' | 'webgl' | null>(
        activeBackend === 'webgpu' || activeBackend === 'webgl'
            ? activeBackend
            : null
    );
    const gpuPersistenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
        null
    );
    const [persistGpuSnapshot, setPersistGpuSnapshot] = useState(false);

    useEffect(() => {
        if (activeBackend === 'webgpu' || activeBackend === 'webgl') {
            lastGpuBackendRef.current = activeBackend;
            gpuRenderingFailed.current = false;
        }
    }, [activeBackend]);

    useEffect(() => {
        failedBackendsRef.current = new Set(diagnostics.failedBackends);
    }, [diagnostics.failedBackends]);

    const activeBackendRef = useRef(activeBackend);
    useEffect(() => {
        activeBackendRef.current = activeBackend;
    }, [activeBackend]);

    const persistGpuSnapshotRef = useRef(persistGpuSnapshot);
    useEffect(() => {
        persistGpuSnapshotRef.current = persistGpuSnapshot;
    }, [persistGpuSnapshot]);

    const updateDiagnostics = useCallback((backend: string, error?: Error) => {
        setDiagnostics((current) => {
            const normalizedError = error ? toError(error) : undefined;
            const nextFailedBackends = normalizedError
                ? [...current.failedBackends, backend].filter(
                      (value, index, array) => array.indexOf(value) === index
                  )
                : current.failedBackends;

            const nextBackendErrors = normalizedError
                ? { ...current.backendErrors, [backend]: normalizedError }
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
            const normalizedError = toError(error);
            const currentBackend = activeBackend;
            if (typeof console !== 'undefined') {
                // eslint-disable-next-line no-console
                console.error(
                    `[Glow] ${currentBackend} rendering failed:`,
                    normalizedError
                );
            }

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

            if (fallbackMode === 'locked') {
                gpuRenderingFailed.current = true;
                updateDiagnostics(currentBackend, normalizedError);
                onFailure?.(normalizedError, currentBackend);
                setStatus('failed');
                return;
            }

            failedBackendsRef.current.add(currentBackend);
            updateDiagnostics(currentBackend, normalizedError);
            onFailure?.(normalizedError, currentBackend);

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

    const clearGpuPersistenceTimer = useCallback(() => {
        const current = gpuPersistenceTimerRef.current;
        if (current) {
            clearTimeout(current);
            gpuPersistenceTimerRef.current = null;
        }
    }, []);

    const effectiveGpuBackend = useMemo<'webgpu' | 'webgl' | null>(() => {
        if (!isWeb || gpuRenderingFailed.current) {
            return null;
        }
        if (activeBackend === 'css') {
            return persistGpuSnapshot ? lastGpuBackendRef.current : null;
        }
        return activeBackend;
    }, [activeBackend, isWeb, persistGpuSnapshot]);

    const shouldRenderGpu = useMemo(
        () =>
            isWeb &&
            !gpuRenderingFailed.current &&
            (activeBackend !== 'css' || persistGpuSnapshot),
        [activeBackend, isWeb, persistGpuSnapshot]
    );

    const shouldRenderCss = useMemo(
        () =>
            activeBackend === 'css' ||
            (gpuRenderingFailed.current &&
                enableCssFallback &&
                fallbackMode === 'adaptive'),
        [activeBackend, enableCssFallback, fallbackMode]
    );

    const shouldRenderGpuRef = useRef(shouldRenderGpu);
    useEffect(() => {
        shouldRenderGpuRef.current = shouldRenderGpu;
    }, [shouldRenderGpu]);

    const rendererPreferredBackend = useMemo(
        () => effectiveGpuBackend ?? preferredBackend,
        [effectiveGpuBackend, preferredBackend]
    );

    const handleGpuReady = useCallback(() => {
        const readyBackend =
            effectiveGpuBackend ?? lastGpuBackendRef.current ?? activeBackend;
        if (typeof console !== 'undefined') {
            // eslint-disable-next-line no-console
            console.log(`[Glow] ${readyBackend} ready`, {
                persistGpuSnapshot,
                lastGpuBackend: lastGpuBackendRef.current,
            });
        }
        if (activeBackend === 'css' && persistGpuSnapshot) {
            return;
        }
        clearGpuPersistenceTimer();
        setPersistGpuSnapshot(false);
        setStatus('ready');
        onReady?.();
    }, [
        activeBackend,
        clearGpuPersistenceTimer,
        effectiveGpuBackend,
        onReady,
        persistGpuSnapshot,
    ]);

    const handleGpuBackendChange = useCallback(
        (backend: string | undefined) => {
            if (typeof console !== 'undefined') {
                // eslint-disable-next-line no-console
                console.log('[Glow] GPU backend changed to', backend);
            }
            if (!backend) {
                return;
            }
            const currentActiveBackend = activeBackendRef.current;
            const currentPersist = persistGpuSnapshotRef.current;
            const currentShouldRenderGpu = shouldRenderGpuRef.current;
            if (!currentShouldRenderGpu) {
                if (typeof console !== 'undefined') {
                    // eslint-disable-next-line no-console
                    console.log(
                        '[Glow] skipping GPU snapshot buffering; renderer not active',
                        {
                            activeBackend: currentActiveBackend,
                            persistGpuSnapshot: currentPersist,
                            shouldRenderGpu: currentShouldRenderGpu,
                        }
                    );
                }
                updateDiagnostics(backend);
                return;
            }
            setPersistGpuSnapshot(true);
            if (currentActiveBackend !== 'css') {
                lastGpuBackendRef.current = currentActiveBackend as
                    | 'webgpu'
                    | 'webgl';
            }
            clearGpuPersistenceTimer();
            gpuPersistenceTimerRef.current = setTimeout(() => {
                gpuPersistenceTimerRef.current = null;
                setPersistGpuSnapshot(false);
            }, GPU_SNAPSHOT_PERSIST_MS);
            if (typeof console !== 'undefined') {
                // eslint-disable-next-line no-console
                console.log('[Glow] buffering GPU snapshot for CSS switch', {
                    activeBackend: currentActiveBackend,
                    lastGpuBackend: lastGpuBackendRef.current,
                    persistGpuSnapshot: true,
                });
            }
            updateDiagnostics(backend);
        },
        [
            activeBackend,
            clearGpuPersistenceTimer,
            onBackendChange,
            persistGpuSnapshot,
            shouldRenderGpu,
            updateDiagnostics,
        ]
    );

    useEffect(() => {
        if (typeof console !== 'undefined') {
            // eslint-disable-next-line no-console
            console.log('[Glow] persistGpuSnapshot changed', {
                persistGpuSnapshot,
                lastGpuBackend: lastGpuBackendRef.current,
            });
        }
    }, [persistGpuSnapshot]);

    useEffect(() => {
        const resolvedBackend = selectBackendPreference(
            preferredBackend,
            webgpuAvailable,
            webglAvailable
        );

        const currentActiveBackend = activeBackendRef.current;

        if (
            fallbackMode === 'locked' &&
            typeof currentActiveBackend === 'string' &&
            resolvedBackend !== currentActiveBackend
        ) {
            return;
        }

        // If user explicitly selected this backend (not 'auto'), clear its failed status
        // to give it a fresh try
        if (
            preferredBackend !== 'auto' &&
            preferredBackend === resolvedBackend
        ) {
            failedBackendsRef.current.delete(resolvedBackend);
        }

        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        const previousBackend = activeBackendRef.current;
        if (
            resolvedBackend === 'css' &&
            previousBackend !== 'css' &&
            !persistGpuSnapshotRef.current
        ) {
            if (typeof console !== 'undefined') {
                // eslint-disable-next-line no-console
                console.log(
                    '[Glow] pre-buffering GPU snapshot before CSS switch',
                    {
                        previousBackend,
                    }
                );
            }
            setPersistGpuSnapshot(true);
        }

        if (failedBackendsRef.current.has(resolvedBackend)) {
            if (fallbackMode === 'locked') {
                setStatus('failed');
            } else if (enableCssFallback) {
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
    }, [
        enableCssFallback,
        fallbackBehavior,
        fallbackMode,
        preferredBackend,
        webglAvailable,
        webgpuAvailable,
    ]);

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

    useEffect(() => {
        if (typeof console !== 'undefined') {
            // eslint-disable-next-line no-console
            console.log('[Glow] render mode flags updated', {
                activeBackend,
                shouldRenderGpu,
                shouldRenderCss,
                persistGpuSnapshot,
            });
        }
    }, [activeBackend, persistGpuSnapshot, shouldRenderCss, shouldRenderGpu]);

    const cssAnimationStyle = useMemo(
        () => createWebGlowAnimationStyle(cssStartTime),
        [cssStartTime]
    );

    // Update CSS start time when switching to CSS mode
    useEffect(() => {
        if (shouldRenderCss) {
            if (typeof console !== 'undefined') {
                // eslint-disable-next-line no-console
                console.log('[Glow] entering CSS render mode', {
                    cssStartTime: timeline.getTimeSeconds(),
                    persistGpuSnapshot,
                });
            }
            setCssStartTime(timeline.getTimeSeconds());
        }
    }, [shouldRenderCss, timeline]);

    if (!isWeb) {
        return null;
    }

    const shouldShowGpuSnapshot = shouldRenderGpu && persistGpuSnapshot;

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
                        opacity: shouldShowGpuSnapshot ? 0 : opacity,
                        ...cssAnimationStyle.style,
                    }}
                />
            )}
            {shouldRenderGpu && (
                <EffectRendererWithMetrics
                    descriptor={glowEffectDescriptor}
                    timeline={timeline}
                    state={state}
                    groupId="glow"
                    groupZIndex={1}
                    preferredBackend={rendererPreferredBackend}
                    padding={padding}
                    borderRadius={borderRadius}
                    sizing={sizing}
                    blendMode="lighter"
                    snapshotStyle={{
                        ...containerStyle,
                        opacity: persistGpuSnapshot ? 1 : undefined,
                    }}
                    containerStyle={containerStyle}
                />
            )}
        </>
    );
};
