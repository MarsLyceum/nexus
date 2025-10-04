import React, { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { GlowKeyframes } from '../components/GlowKeyframes';
import { hasWebGPU, hasWebGL, WebGPUGlow } from '../components/WebGPUGlow';
import type { GlowBackendId } from '../components/glowRenderer';
import { WEBGPU_GLOW_OUTER_PAD_PX } from './glowSpec';
import { useBreathingGlow } from '../hooks/useBreathingGlow';
import { useAnimationTimeline } from './timeline';
import { createWebGlowAnimationStyle } from '../utils';

type GlowIntensityRange = {
    readonly min: number;
    readonly max: number;
};

type GlowSceneConfig = {
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

type GlowScene = {
    readonly kind: 'glow';
    readonly config: GlowSceneConfig;
};

export type AnimationScene = GlowScene;

export type SceneStatus = 'pending' | 'ready' | 'failed';

export type SceneRenderLayerType = 'dom' | 'gpu' | 'css';

export type SceneRenderLayerPlacement = 'background' | 'content' | 'foreground';

export type SceneRenderLayer = {
    readonly id: string;
    readonly type: SceneRenderLayerType;
    readonly placement: SceneRenderLayerPlacement;
    readonly element: React.ReactNode | null;
};

export type SceneRenderResult = {
    readonly layers: ReadonlyArray<SceneRenderLayer>;
    readonly containerStyle: Record<string, unknown>;
    readonly status: SceneStatus;
    readonly activeBackend: GlowBackendId | 'css';
};

export type SceneRenderOptions = {
    readonly visibility?: Partial<Record<string, boolean>>;
    readonly preferredBackend?: GlowBackendId | 'auto' | 'css';
};

const defaultGlowConfig: GlowSceneConfig = {
    color: '#ffffff',
    borderRadius: 0,
    focal: { x: 0.5, y: 0.5 },
    opacity: 1,
    animate: true,
    intensity: { min: 0.2, max: 0.5 },
    duration: 3000,
    padding: WEBGPU_GLOW_OUTER_PAD_PX,
};

export const buildGlowScene = (input: GlowSceneInput): GlowScene => ({
    kind: 'glow',
    config: {
        ...defaultGlowConfig,
        ...input,
        focal: input.focal ?? defaultGlowConfig.focal,
        intensity: input.intensity ?? defaultGlowConfig.intensity,
    },
});

const useGlowScene = (
    config: GlowSceneConfig,
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
    }, [isWeb]);
    const [gpuFailed, setGpuFailed] = useState(false);
    const visibility = options?.visibility ?? {};
    const preferredBackend = options?.preferredBackend ?? 'auto';
    const wantsCssOnly = preferredBackend === 'css';
    const isGpuVisibilityEnabled =
        !wantsCssOnly && visibility['gpu-glow'] !== false;
    const shouldAnimateGpu =
        canUseGpu && !gpuFailed && isGpuVisibilityEnabled && !wantsCssOnly;

    const [status, setStatus] = useState<SceneStatus>(
        shouldAnimateGpu ? 'pending' : 'ready'
    );

    useEffect(() => {
        setStatus(shouldAnimateGpu ? 'pending' : 'ready');
    }, [shouldAnimateGpu]);

    useEffect(() => {
        setGpuFailed(false);
    }, [config, canUseGpu]);

    const showCssGlow = useMemo(
        () => isWeb && (!shouldAnimateGpu || status !== 'ready'),
        [isWeb, shouldAnimateGpu, status]
    );

    useEffect(() => {
        setGpuFailed(false);
    }, [isGpuVisibilityEnabled]);

    const [activeBackend, setActiveBackend] = useState<GlowBackendId | 'css'>(
        'css'
    );
    const { intensity } = config;
    const glowIntensity = useBreathingGlow(
        (intensity.min + intensity.max) / 2,
        intensity.min,
        intensity.max,
        config.duration
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
        () => createWebGlowAnimationStyle(timeline.getTimeSeconds()),
        [showCssGlow, timeline]
    );

    const containerStyle = useMemo(() => {
        if (isWeb) {
            const base: Record<string, unknown> = {
                position: 'relative',
                isolation: 'isolate',
                width: '100%',
                height: '100%',
                borderRadius: config.borderRadius,
            };
            if (showCssGlow) {
                Object.assign(base, webAnimation.style);
            }
            return base;
        }
        return {
            shadowColor: config.color,
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 24,
            shadowOpacity: animatedNativeShadow,
            width: '100%',
            height: '100%',
        };
    }, [
        animatedNativeShadow,
        config.color,
        config.borderRadius,
        isWeb,
        showCssGlow,
        webAnimation,
    ]);

    const layers = useMemo(() => {
        const resolveVisibility = (id: string, fallback = true) =>
            visibility[id] ?? fallback;

        const domLayer: SceneRenderLayer = {
            id: 'dom-base',
            type: 'dom',
            placement: 'content',
            element: null,
        };

        const result: SceneRenderLayer[] = resolveVisibility('dom-base')
            ? [domLayer]
            : [];

        if (isWeb && showCssGlow && resolveVisibility('css-glow')) {
            result.push({
                id: 'css-glow',
                type: 'css',
                placement: 'background',
                element: (
                    <GlowKeyframes color={config.color} focal={config.focal} />
                ),
            });
        }

        if (isWeb && shouldAnimateGpu && resolveVisibility('gpu-glow')) {
            result.push({
                id: 'gpu-glow',
                type: 'gpu',
                placement: 'background',
                element: (
                    <WebGPUGlow
                        color={config.color}
                        borderRadius={config.borderRadius}
                        focal={config.focal}
                        opacity={config.opacity}
                        animate={config.animate}
                        preferredBackend={preferredBackend}
                        onReady={() => {
                            setStatus('ready');
                            setGpuFailed(false);
                        }}
                        onFailure={(error) => {
                            setStatus('failed');
                            setGpuFailed(true);
                            console.error(
                                '[AnimationScene] WebGPU glow failed',
                                error
                            );
                        }}
                    />
                ),
            });
        }

        return result;
    }, [
        config.animate,
        config.borderRadius,
        config.color,
        config.focal,
        config.opacity,
        isWeb,
        options?.preferredBackend,
        options?.visibility,
        shouldAnimateGpu,
        showCssGlow,
    ]);

    return {
        layers,
        containerStyle,
        status,
    };
};

export const useRenderAnimationScene = (
    scene: AnimationScene,
    options?: SceneRenderOptions
): SceneRenderResult => {
    if (scene.kind === 'glow') {
        return useGlowScene(scene.config, options);
    }
    throw new Error('Unsupported animation scene');
};

export const renderAnimationScene = useRenderAnimationScene;
