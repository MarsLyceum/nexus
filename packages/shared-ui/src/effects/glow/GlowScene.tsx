import React, { useMemo } from 'react';
import { Animated } from 'react-native';
import type { SceneRenderLayer } from '../../animation/sceneSystem';

import { useBreathingGlow } from '../../hooks/useBreathingGlow';
import { createWebGlowAnimationStyle } from '../../utils';
import {
    createEffectScene,
    type EffectSceneContainerContext,
    type EffectSceneDerivedContext,
    type EffectSceneLayerContext,
    type EffectSceneGpuLayerContext,
} from '../effectScene';
import { GlowKeyframes } from './GlowKeyframes';
import { GlowEffect } from './GlowEffect';
import { WEBGPU_GLOW_OUTER_PAD_PX } from './glowSpec';

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

type GlowDerivedState = {
    readonly animatedShadow: Animated.AnimatedInterpolation<number>;
    readonly webAnimation: ReturnType<
        typeof createWebGlowAnimationStyle
    > | null;
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

const resolveGlowState = (input: Partial<GlowSceneState>): GlowSceneState => ({
    ...defaultGlowState,
    ...input,
    focal: input.focal ?? defaultGlowState.focal,
    intensity: input.intensity ?? defaultGlowState.intensity,
    padding: input.padding ?? defaultGlowState.padding,
});

const useGlowDerivedState = ({
    state,
    base,
}: EffectSceneDerivedContext<GlowSceneState>): GlowDerivedState => {
    const { intensity, duration } = state;
    const glowIntensity = useBreathingGlow(
        (intensity.min + intensity.max) * 0.5,
        intensity.min,
        intensity.max,
        duration
    );

    const animatedShadow = useMemo(
        () =>
            glowIntensity.interpolate({
                inputRange: [intensity.min, intensity.max],
                outputRange: [intensity.min * 1.5, intensity.max * 1.5],
            }),
        [glowIntensity, intensity.max, intensity.min]
    );

    const webAnimation = useMemo(
        () =>
            base.isWeb && base.showCssLayer
                ? createWebGlowAnimationStyle(base.timeline.getTimeSeconds())
                : null,
        [base.isWeb, base.showCssLayer, base.timeline]
    );

    return { animatedShadow, webAnimation };
};

const buildContainerStyle = ({
    state,
    derived,
    base,
}: EffectSceneContainerContext<GlowSceneState, GlowDerivedState>): Record<
    string,
    unknown
> => {
    if (base.isWeb) {
        const style: Record<string, unknown> = {
            position: 'relative',
            isolation: 'isolate',
            width: '100%',
            height: '100%',
            borderRadius: state.borderRadius,
        };
        if (derived.webAnimation) {
            Object.assign(style, derived.webAnimation.style);
        }
        return style;
    }
    return {
        shadowColor: state.color,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 24,
        shadowOpacity: derived.animatedShadow,
        width: '100%',
        height: '100%',
    };
};

const createBaseLayer = ({
    base,
}: EffectSceneLayerContext<
    GlowSceneState,
    GlowDerivedState
>): SceneRenderLayer => ({
    id: base.layerIds.base,
    type: 'dom',
    placement: 'content',
    element: null,
});

const createCssLayer = ({
    state,
    base,
}: EffectSceneLayerContext<
    GlowSceneState,
    GlowDerivedState
>): SceneRenderLayer => ({
    id: base.layerIds.css,
    type: 'css',
    placement: 'background',
    element: <GlowKeyframes color={state.color} focal={state.focal} />,
});

const createGpuLayer = ({
    state,
    base,
    onReady,
    onFailure,
}: EffectSceneGpuLayerContext<
    GlowSceneState,
    GlowDerivedState
>): SceneRenderLayer => ({
    id: base.layerIds.gpu,
    type: 'gpu',
    placement: 'background',
    element: (
        <GlowEffect
            color={state.color}
            borderRadius={state.borderRadius}
            focal={state.focal}
            opacity={state.opacity}
            animate={state.animate}
            preferredBackend={base.preferredBackend}
            onBackendChange={base.handleActiveBackendChange}
            onReady={onReady}
            onFailure={onFailure}
        />
    ),
});

const { buildScene } = createEffectScene<GlowSceneState, GlowDerivedState>({
    id: 'glow',
    defaultState: defaultGlowState,
    resolveState: resolveGlowState,
    layerIds: {
        base: 'dom-base',
        css: 'css-glow',
        gpu: 'gpu-glow',
    },
    useDerivedState: useGlowDerivedState,
    buildContainerStyle,
    createLayers: {
        base: createBaseLayer,
        css: createCssLayer,
        gpu: createGpuLayer,
    },
    createSceneOptions: () => ({
        backendPreference: ['webgpu', 'webgl', 'css'],
    }),
});

export type GlowSceneDerived = GlowDerivedState;

export const buildGlowScene = (input: GlowSceneInput) => buildScene(input);
