import React, { useMemo } from 'react';

import { glowEffectDescriptor } from './glowConfig';
import { WEBGPU_GLOW_OUTER_PAD_PX } from './glowSpec';
import { clampFocal } from '../../utils/geometry';
import { useAnimationTimeline } from '../../animation/timeline';
import { EffectRendererWithMetrics } from '../../engine/components/EffectRendererWithMetrics';

export type GlowEffectProps = {
    readonly color: string;
    readonly borderRadius?: number;
    readonly focal?: { readonly x: number; readonly y: number };
    readonly opacity?: number;
    readonly animate?: boolean;
    readonly preferredBackend?: string;
    readonly onFailure?: (error: Error) => void;
    readonly onReady?: () => void;
    readonly onBackendChange?: (backend: string) => void;
};

export const GlowEffect: React.FC<GlowEffectProps> = ({
    color,
    borderRadius = 0,
    focal = { x: 0.5, y: 0.4 },
    opacity = 1,
    animate = true,
    preferredBackend = 'auto',
    onFailure,
    onReady,
    onBackendChange,
}) => {
    const timeline = useAnimationTimeline();
    const normalizedFocal = useMemo(() => clampFocal(focal), [focal]);

    const handleBackendChange = React.useCallback(
        (backend: string) => {
            console.log('[GlowEffect] backend change received', {
                backend,
                preferredBackend,
                hasNavigatorGpu:
                    typeof navigator !== 'undefined' && 'gpu' in navigator,
            });
            onBackendChange?.(backend);
        },
        [onBackendChange, preferredBackend]
    );

    const handleReady = React.useCallback(() => {
        console.log('[GlowEffect] Ready event fired', {
            hasCanvasSupport: typeof HTMLCanvasElement !== 'undefined',
            hasNavigatorGpu:
                typeof navigator !== 'undefined' && 'gpu' in navigator,
        });
        onReady?.();
    }, [onReady]);

    const handleFailure = React.useCallback(
        (error: Error) => {
            console.error('[GlowEffect] GPU rendering failed:', error);
            onFailure?.(error);
        },
        [onFailure]
    );

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

    return (
        <EffectRendererWithMetrics
            descriptor={glowEffectDescriptor}
            timeline={timeline}
            state={state}
            preferredBackend={preferredBackend}
            padding={WEBGPU_GLOW_OUTER_PAD_PX}
            borderRadius={borderRadius}
            sizing="viewport"
            canvasStyle={{
                mixBlendMode: 'plus-lighter',
                width: '100%',
                height: '100%',
            }}
            onFailure={handleFailure}
            onReady={handleReady}
            onBackendChange={handleBackendChange}
        />
    );
};
