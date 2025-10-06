import React, { useMemo } from 'react';

import { glowEffectDescriptor } from './glowConfig';
import { WEBGPU_GLOW_OUTER_PAD_PX } from './glowSpec';
import { clampFocal } from '../../utils/geometry';
import { useAnimationTimeline } from '../../animation/timeline';
import { EffectRendererWithMetrics } from '../../engine/components/EffectRendererWithMetrics';

export type GlowProps = {
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

export const Glow: React.FC<GlowProps> = ({
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
                mixBlendMode: 'screen',
                width: '100%',
                height: '100%',
            }}
            onFailure={onFailure}
            onReady={onReady}
            onBackendChange={onBackendChange}
        />
    );
};
