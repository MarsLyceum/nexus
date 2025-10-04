import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { GlowKeyframes } from './GlowKeyframes';
import { hasWebGPU, hasWebGL } from './glowDescriptor';
import { WEBGPU_GLOW_OUTER_PAD_PX } from './glowSpec';
import { useBreathingGlow } from '../../hooks/useBreathingGlow';
import { useAnimationTimeline } from '../../animation/timeline';
import { createWebGlowAnimationStyle } from '../../utils';
import {
    Scene,
    SceneStatus,
    SceneRenderLayer,
    SceneRenderResult,
    SceneRenderOptions,
    SceneActiveBackend,
    buildScene as buildGenericScene,
    resolveVisibility,
} from '../../animation/sceneSystem';
import {
    registerSceneRenderer,
    createSceneRenderer,
} from '../../animation/sceneRenderer';
import { GlowEffect } from './GlowEffect';

type GlowIntensityRange = {
    readonly min: number;
    readonly max: number;
};

export type GlowSceneState = {
    readonly color: string;
    readonly borderRadius: number;
    readonly focal: { readonly x: number; readonly y: number };
    readonly opacity: number;
    readonly animate: boolean;
    readonly intensity: GlowIntensityRange;
    readonly duration: number;
    readonly padding: number;
};

export type GlowSceneInput = {
    readonly color: string;
    readonly borderRadius?: number;
    readonly focal?: { readonly x: number; readonly y: number };
    readonly opacity?: number;
    readonly animate?: boolean;
    readonly intensity?: GlowIntensityRange;
    readonly duration?: number;
    readonly padding?: number;
};

const defaultGlowState: GlowSceneState = {
    color: '#ffffff',
    borderRadius: 0,
    focal: { x: 0.5, y: 0.5 },
    opacity: 1,
    animate: true,
    intensity: { min: 0.2, max: 0.5 },
    duration: 3000,
    padding: WEBGPU_GLOW_OUTER_PAD_PX,
};

export const buildGlowScene = (input: GlowSceneInput): Scene<GlowSceneState> =>
    buildGenericScene<GlowSceneState>('glow', {
        ...defaultGlowState,
        ...input,
        focal: input.focal ?? defaultGlowState.focal,
        intensity: input.intensity ?? defaultGlowState.intensity,
    });

const useGlowSceneRenderer = (
    state: GlowSceneState,
    options?: SceneRenderOptions
): SceneRenderResult => {
    const timeline = useAnimationTimeline();
    const isWeb = Platform.OS === 'web';
    const [gpuAvailability, setGpuAvailability] = useState({
        webgpu: false,
        webgl: false,
    });
    const canUseGpu =
        isWeb && (gpuAvailability.webgpu || gpuAvailability.webgl);

    useEffect(() => {
        if (!isWeb) {
            return;
        }
        const availability = {
            webgpu: hasWebGPU(),
            webgl: hasWebGL(),
        };
        setGpuAvailability(availability);
        console.log('[GlowScene] gpu availability detected', availability);
    }, [isWeb]);
    const [gpuFailed, setGpuFailed] = useState(false);
    const visibility = useMemo(
        () => options?.visibility ?? {},
        [options?.visibility]
    );
    useEffect(() => {
        console.log('[GlowScene] visibility updated', {
            visibility,
            hasGpuEntry: Object.prototype.hasOwnProperty.call(
                visibility,
                'gpu-glow'
            ),
            gpuEntryValue:
                Object.prototype.hasOwnProperty.call(visibility, 'gpu-glow') &&
                visibility['gpu-glow'],
            hasCssEntry: Object.prototype.hasOwnProperty.call(
                visibility,
                'css-glow'
            ),
            cssEntryValue:
                Object.prototype.hasOwnProperty.call(visibility, 'css-glow') &&
                visibility['css-glow'],
        });
    }, [visibility]);
    const preferredBackend = options?.preferredBackend ?? 'auto';
    const wantsCssOnly = preferredBackend === 'css';
    useEffect(() => {
        console.log('[GlowScene] preferredBackend received', {
            preferredBackend,
        });
    }, [preferredBackend]);
    const isGpuVisibilityEnabled =
        !wantsCssOnly && visibility['gpu-glow'] !== false;
    const shouldAnimateGpu =
        canUseGpu && !gpuFailed && isGpuVisibilityEnabled && !wantsCssOnly;

    const [status, setStatus] = useState<SceneStatus>(
        shouldAnimateGpu ? 'pending' : 'ready'
    );

    useEffect(() => {
        console.log('[GlowScene] animate decision updated', {
            canUseGpu,
            gpuFailed,
            isGpuVisibilityEnabled,
            wantsCssOnly,
            shouldAnimateGpu,
        });
    }, [
        canUseGpu,
        gpuFailed,
        isGpuVisibilityEnabled,
        wantsCssOnly,
        shouldAnimateGpu,
    ]);

    useEffect(() => {
        if (!shouldAnimateGpu) {
            console.log('[GlowScene] GPU layer disabled', {
                reason: {
                    isWeb,
                    canUseGpu,
                    gpuFailed,
                    isGpuVisibilityEnabled,
                    wantsCssOnly,
                    preferredBackend,
                },
                gpuAvailability,
                visibility,
            });
        }
    }, [
        shouldAnimateGpu,
        isWeb,
        canUseGpu,
        gpuFailed,
        isGpuVisibilityEnabled,
        wantsCssOnly,
        preferredBackend,
        gpuAvailability,
        visibility,
    ]);

    useEffect(() => {
        setStatus(shouldAnimateGpu ? 'pending' : 'ready');
    }, [shouldAnimateGpu]);

    useEffect(() => {
        setGpuFailed(false);
    }, [state, canUseGpu]);

    useEffect(() => {
        console.log('[GlowScene] status changed', {
            status,
            shouldAnimateGpu,
            gpuFailed,
            canUseGpu,
            isGpuVisibilityEnabled,
        });
    }, [
        status,
        shouldAnimateGpu,
        gpuFailed,
        canUseGpu,
        isGpuVisibilityEnabled,
    ]);

    const [activeBackend, setActiveBackend] =
        useState<SceneActiveBackend>('css');

    const handleActiveBackendChange = useCallback(
        (nextBackend: SceneActiveBackend) => {
            console.log('[GlowScene] onBackendChange received', {
                nextBackend,
                shouldAnimateGpu,
                status,
                gpuFailed,
                visibility,
                gpuAvailability,
            });
            setActiveBackend(nextBackend);
        },
        [gpuAvailability, gpuFailed, shouldAnimateGpu, status, visibility]
    );

    const shouldRenderGpuLayer = useMemo(() => {
        const hasBackendReady = activeBackend !== 'none';
        const statusAllowsGpu = status !== 'failed';
        const result =
            isWeb && shouldAnimateGpu && statusAllowsGpu && hasBackendReady;
        console.log('[GlowScene] shouldRenderGpuLayer computed', {
            result,
            isWeb,
            shouldAnimateGpu,
            status,
            activeBackend,
            gpuFailed,
            hasBackendReady,
            statusAllowsGpu,
        });
        return result;
    }, [isWeb, shouldAnimateGpu, status, activeBackend, gpuFailed]);

    const showCssGlow = useMemo(() => {
        const result = isWeb && (!shouldRenderGpuLayer || gpuFailed);
        console.log('[GlowScene] showCssGlow computed', {
            result,
            isWeb,
            shouldRenderGpuLayer,
            status,
            gpuFailed,
        });
        return result;
    }, [isWeb, shouldRenderGpuLayer, status, gpuFailed]);

    useEffect(() => {
        setGpuFailed(false);
    }, [isGpuVisibilityEnabled]);

    useEffect(() => {
        console.log('[GlowScene] active backend updated', {
            activeBackend,
            shouldAnimateGpu,
            status,
        });
        if (activeBackend === 'css' && shouldAnimateGpu && !gpuFailed) {
            console.log(
                '[GlowScene] unexpected css backend while gpu expected',
                {
                    status,
                    gpuFailed,
                    visibility,
                    gpuAvailability,
                }
            );
        }
    }, [
        activeBackend,
        shouldAnimateGpu,
        status,
        gpuFailed,
        visibility,
        gpuAvailability,
    ]);
    const { intensity } = state;
    const glowIntensity = useBreathingGlow(
        (intensity.min + intensity.max) / 2,
        intensity.min,
        intensity.max,
        state.duration
    );

    const animatedNativeShadow = useMemo(
        () =>
            glowIntensity.interpolate({
                inputRange: [intensity.min, intensity.max],
                outputRange: [intensity.min * 1.5, intensity.max * 1.5],
            }),
        [glowIntensity, intensity.max, intensity.min]
    );

    const webAnimation = useMemo(
        () =>
            isWeb && showCssGlow
                ? createWebGlowAnimationStyle(timeline.getTimeSeconds())
                : null,
        [isWeb, showCssGlow, timeline]
    );

    const containerStyle = useMemo(() => {
        if (isWeb) {
            const base: Record<string, unknown> = {
                position: 'relative',
                isolation: 'isolate',
                width: '100%',
                height: '100%',
                borderRadius: state.borderRadius,
            };
            if (webAnimation) {
                Object.assign(base, webAnimation.style);
            }
            return base;
        }
        return {
            shadowColor: state.color,
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 24,
            shadowOpacity: animatedNativeShadow,
            width: '100%',
            height: '100%',
        };
    }, [
        animatedNativeShadow,
        state.color,
        state.borderRadius,
        isWeb,
        webAnimation,
    ]);

    const layers = useMemo(() => {
        const domLayer: SceneRenderLayer = {
            id: 'dom-base',
            type: 'dom',
            placement: 'content',
            element: null,
        };

        const result: SceneRenderLayer[] = resolveVisibility(
            visibility,
            'dom-base'
        )
            ? [domLayer]
            : [];

        if (isWeb && showCssGlow && resolveVisibility(visibility, 'css-glow')) {
            result.push({
                id: 'css-glow',
                type: 'css',
                placement: 'background',
                element: (
                    <GlowKeyframes color={state.color} focal={state.focal} />
                ),
            });
        }

        if (
            isWeb &&
            shouldRenderGpuLayer &&
            resolveVisibility(visibility, 'gpu-glow')
        ) {
            result.push({
                id: 'gpu-glow',
                type: 'gpu',
                placement: 'background',
                element: (
                    <GlowEffect
                        color={state.color}
                        borderRadius={state.borderRadius}
                        focal={state.focal}
                        opacity={state.opacity}
                        animate={state.animate}
                        preferredBackend={preferredBackend}
                        onBackendChange={handleActiveBackendChange}
                        onReady={() => {
                            console.log(
                                '[GlowScene] GPU ready callback triggered'
                            );
                            setStatus('ready');
                            setGpuFailed(false);
                        }}
                        onFailure={(err) => {
                            console.error('[GlowScene] GPU failed:', err);
                            setStatus('failed');
                            setGpuFailed(true);
                            // setActiveBackend('css');
                        }}
                    />
                ),
            });
        }

        console.log('[GlowScene] layer composition', {
            isWeb,
            hasGpuLayer: result.some((layer) => layer.id === 'gpu-glow'),
            hasCssLayer: result.some((layer) => layer.id === 'css-glow'),
            layerIds: result.map((layer) => layer.id),
            shouldAnimateGpu,
            showCssGlow,
            status,
            gpuFailed,
            activeBackend,
            visibility,
            preferredBackend,
            gpuAvailability,
        });

        return result;
    }, [
        state.animate,
        state.borderRadius,
        state.color,
        state.focal,
        state.opacity,
        isWeb,
        preferredBackend,
        visibility,
        shouldAnimateGpu,
        shouldRenderGpuLayer,
        showCssGlow,
        shouldRenderGpuLayer,
        showCssGlow,
        setActiveBackend,
    ]);

    return {
        layers,
        containerStyle,
        status,
        activeBackend,
    };
};

const glowSceneRenderer = createSceneRenderer<GlowSceneState>(
    'glow',
    useGlowSceneRenderer
);

registerSceneRenderer(glowSceneRenderer);
