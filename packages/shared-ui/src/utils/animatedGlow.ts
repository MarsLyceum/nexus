import { glowEffect, type GlowFocalPoint } from '../effects/glow/glowSpec';
import { type CssAnimationStyle } from '../animation/cssAnimationUtils';

export type WebGlowAnimationStyle = CssAnimationStyle;

export type GlowKeyframesOptions = {
    readonly focal?: GlowFocalPoint;
};

export const createGlowKeyframes = (
    color: string,
    options: GlowKeyframesOptions = {}
) => glowEffect.createKeyframes({ color, focal: options.focal });

export const createWebGlowAnimationStyle = (
    elapsedSeconds = 0
): WebGlowAnimationStyle => glowEffect.createAnimationStyle(elapsedSeconds);
