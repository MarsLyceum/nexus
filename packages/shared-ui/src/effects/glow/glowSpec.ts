import { createCssPropertyDeclaration } from '../../animation/cssAnimationUtils';
import {
    createEffectDefinition,
    type EffectPropertyFormatterMap,
} from '../effectBuilder';
import type { EffectAnimationSpec } from '../../animation/effectPropertyMapping';

export const WEBGPU_GLOW_OUTER_PAD_PX = 144;
export const GLOW_RIM_BOOST = 1.75;
export const GLOW_RIM_SPREAD = 28;
export const GLOW_RIM_WIDTH_SCALE = 1;
export const GLOW_NOISE_MIX = 8;
export const GLOW_INTENSITY_SCALE = 0.65;

export type GlowFocalPoint = { readonly x: number; readonly y: number };

const formatOpacity = (opacity: number) =>
    opacity.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');

const fallbackComponent = (component: number) =>
    Number.isFinite(component) ? component : 255;

const expandHex = (value: string) => value.repeat(2);

const parseHexColor = (color: string) => {
    const normalized = color.trim().replace('#', '');
    if (normalized.length === 3) {
        const expanded = [...normalized].map((value) => expandHex(value));
        const [r, g, b] = expanded;
        return {
            r: fallbackComponent(Number.parseInt(r, 16)),
            g: fallbackComponent(Number.parseInt(g, 16)),
            b: fallbackComponent(Number.parseInt(b, 16)),
        } as const;
    }
    const toComponent = (start: number) =>
        Number.parseInt(normalized.slice(start, start + 2), 16);
    const r = toComponent(0);
    const g = toComponent(2);
    const b = toComponent(4);
    return {
        r: fallbackComponent(r),
        g: fallbackComponent(g),
        b: fallbackComponent(b),
    } as const;
};

const clampRatio = (value: number) => Math.min(1, Math.max(0, value));

const roundPx = (value: number) =>
    `${value
        .toFixed(2)
        .replace(/\.0+$/, '')
        .replace(/\.([1-9]*)0+$/, '.$1')}px`;

const formatAlphaExpression = (alpha: number, scaleExpression: string) => {
    const clamped = clampRatio(alpha);
    if (scaleExpression === '1') {
        return formatOpacity(clamped);
    }
    return `calc(${formatOpacity(clamped)} * (${scaleExpression}))`;
};

const CSS_SHADOW_INTENSITY = GLOW_INTENSITY_SCALE;

const createLayerSet = (
    opacity: number,
    definitions: ReadonlyArray<{
        readonly offsetX: number;
        readonly offsetY: number;
        readonly blur: number;
        readonly spread: number;
        readonly weight: number;
        readonly rim: boolean;
    }>
) => {
    const normalizedOpacity = clampRatio(opacity) * CSS_SHADOW_INTENSITY;
    const totalWeight = definitions.reduce(
        (acc, definition) => acc + definition.weight,
        0
    );
    if (totalWeight === 0) {
        return definitions.map((definition) => ({
            ...definition,
            alpha: normalizedOpacity,
        }));
    }
    const focusTotal = definitions
        .filter((definition) => definition.rim)
        .reduce((acc, definition) => acc + definition.weight, 0);
    const haloTotal = totalWeight - focusTotal;
    const focusedIntensity = normalizedOpacity * 0.7;
    const haloIntensity = normalizedOpacity * 0.3;
    return definitions.map((definition) => {
        const segmentTotal = definition.rim ? focusTotal : haloTotal;
        const baseAlpha = definition.rim ? focusedIntensity : haloIntensity;
        if (segmentTotal === 0) {
            return {
                ...definition,
                alpha: baseAlpha,
            } as const;
        }
        return {
            ...definition,
            alpha: (baseAlpha * definition.weight) / segmentTotal,
        } as const;
    });
};

export const SHADOW_PAD_PX = WEBGPU_GLOW_OUTER_PAD_PX;
export const RIM_WIDTH_PX = GLOW_RIM_SPREAD * GLOW_RIM_WIDTH_SCALE;
export const RIM_WEIGHT_SCALE = GLOW_RIM_BOOST;

const createShadowLayers = (
    color: string,
    opacity: number,
    options: {
        readonly focal?: GlowFocalPoint;
        readonly intensityScaleExpression?: string;
    } = {}
) => {
    const { r, g, b } = parseHexColor(color);
    const rgbExpression = `${r}, ${g}, ${b}`;
    const scaleExpression = options.intensityScaleExpression
        ? `(${options.intensityScaleExpression})`
        : '1';
    const focal = {
        x: clampRatio(options.focal?.x ?? 0.5),
        y: clampRatio(options.focal?.y ?? 0.4),
    } as const;
    const focalOffsetScale = SHADOW_PAD_PX * 0.42;
    const offsetX = (focal.x - 0.5) * focalOffsetScale;
    const offsetY = (focal.y - 0.5) * focalOffsetScale;

    const haloLayers = createLayerSet(opacity, [
        {
            offsetX: 0,
            offsetY: 0,
            blur: SHADOW_PAD_PX * 0.4,
            spread: SHADOW_PAD_PX * 0.05,
            weight: 0.12,
            rim: false,
        },
        {
            offsetX: 0,
            offsetY: 0,
            blur: SHADOW_PAD_PX * 0.6,
            spread: SHADOW_PAD_PX * 0.08,
            weight: 0.08,
            rim: false,
        },
    ]);

    const focalLayers = createLayerSet(opacity, [
        {
            offsetX,
            offsetY,
            blur: RIM_WIDTH_PX * 2.1,
            spread: 0,
            weight: 0.12,
            rim: true,
        },
        {
            offsetX,
            offsetY,
            blur: RIM_WIDTH_PX * 3,
            spread: RIM_WIDTH_PX * 0.05,
            weight: 0.14,
            rim: true,
        },
        {
            offsetX,
            offsetY,
            blur: RIM_WIDTH_PX * 4,
            spread: RIM_WIDTH_PX * 0.1,
            weight: 0.16,
            rim: true,
        },
    ]);

    const rimLayers = createLayerSet(opacity, [
        {
            offsetX: 0,
            offsetY: 0,
            blur: RIM_WIDTH_PX * 1,
            spread: 0,
            weight: 0.12,
            rim: true,
        },
        {
            offsetX: 0,
            offsetY: 0,
            blur: RIM_WIDTH_PX * 1.6,
            spread: RIM_WIDTH_PX * 0.05,
            weight: 0.18,
            rim: true,
        },
        {
            offsetX: 0,
            offsetY: 0,
            blur: RIM_WIDTH_PX * 2.3,
            spread: RIM_WIDTH_PX * 0.1,
            weight: 0.22,
            rim: true,
        },
    ]);

    return [...haloLayers, ...focalLayers, ...rimLayers]
        .map((layer) => {
            const baseAlphaExpression = formatAlphaExpression(
                layer.alpha,
                scaleExpression
            );
            const alphaValue = layer.rim
                ? formatAlphaExpression(
                      layer.alpha * RIM_WEIGHT_SCALE,
                      scaleExpression
                  )
                : baseAlphaExpression;
            return `${roundPx(layer.offsetX)} ${roundPx(layer.offsetY)} ${roundPx(
                layer.blur
            )} ${roundPx(layer.spread)} rgba(${rgbExpression}, ${alphaValue})`;
        })
        .join(', ');
};

export const formatShadow =
    (color: string, focal?: GlowFocalPoint) => (value: number) => {
        const intensityExpression =
            'var(--glow-alpha, 1) * var(--glow-brightness, 1)';
        const shadowLayers = createShadowLayers(color, value, {
            focal,
            intensityScaleExpression: intensityExpression,
        });
        return `box-shadow: ${shadowLayers};`;
    };

export const formatOpacityValue = (value: number) =>
    `--glow-alpha: ${(value * GLOW_INTENSITY_SCALE).toFixed(3)};`;

export const formatBrightnessValue = (value: number) =>
    `--glow-brightness: ${value.toFixed(3)};`;

export type GlowAnimationTrackName =
    | 'primary'
    | 'secondaryOpacity'
    | 'tertiaryBrightness';

export type GlowCssPropertyName = 'shadowOpacity' | 'opacity' | 'brightness';

export const trackToCssProperty: Record<
    GlowAnimationTrackName,
    GlowCssPropertyName
> = {
    primary: 'shadowOpacity',
    secondaryOpacity: 'opacity',
    tertiaryBrightness: 'brightness',
};

export const cssPropertyToTrack: Record<
    GlowCssPropertyName,
    GlowAnimationTrackName
> = {
    shadowOpacity: 'primary',
    opacity: 'secondaryOpacity',
    brightness: 'tertiaryBrightness',
};

export type GlowCssValue = {
    readonly shadowOpacity: number;
    readonly opacity: number;
    readonly brightness: number;
};

export const TRACK_SEQUENCE: ReadonlyArray<GlowAnimationTrackName> = [
    'primary',
    'secondaryOpacity',
    'tertiaryBrightness',
];

export const glowAnimationNames: Record<GlowAnimationTrackName, string> = {
    primary: 'breathingGlowPrimary',
    secondaryOpacity: 'breathingGlowSecondary',
    tertiaryBrightness: 'breathingGlowTertiary',
};

export const glowAnimationSpec: EffectAnimationSpec<
    GlowAnimationTrackName,
    GlowCssPropertyName
> = {
    tracks: {
        primary: {
            durationSeconds: 4.2,
            keyframes: [
                { at: 0, value: 0 },
                { at: 0.5, value: 1 },
                { at: 1, value: 0 },
            ],
            easing: { x1: 0.45, y1: 0.05, x2: 0.55, y2: 0.95 },
        },
        secondaryOpacity: {
            durationSeconds: 6,
            keyframes: [
                { at: 0, value: 0 },
                { at: 0.5, value: 1 },
                { at: 1, value: 0 },
            ],
            easing: { x1: 0.4, y1: 0, x2: 0.6, y2: 1 },
        },
        tertiaryBrightness: {
            durationSeconds: 7.6,
            keyframes: [
                { at: 0, value: 0 },
                { at: 0.5, value: 1 },
                { at: 1, value: 0 },
            ],
            easing: { x1: 0.42, y1: 0, x2: 0.58, y2: 1 },
        },
    },
    properties: {
        shadowOpacity: {
            trackName: 'primary',
            range: { min: 0.28, max: 0.9 },
        },
        opacity: {
            trackName: 'secondaryOpacity',
            range: { min: 0.85, max: 1 },
        },
        brightness: {
            trackName: 'tertiaryBrightness',
            range: { min: 1, max: 1.04 },
        },
    },
};

export const glowCssVariables = {
    '--glow-alpha': glowAnimationSpec.properties.opacity.range.min,
    '--glow-brightness': glowAnimationSpec.properties.brightness.range.min,
};

export const glowCssPropertyDeclarations = () => [
    createCssPropertyDeclaration(
        '--glow-alpha',
        glowAnimationSpec.properties.opacity.range.min
    ),
    createCssPropertyDeclaration(
        '--glow-brightness',
        glowAnimationSpec.properties.brightness.range.min
    ),
];

const fallbackFocal = { x: 0.5, y: 0.4 } as const;

type GlowFormatterContext = {
    readonly color: string;
    readonly focal?: { readonly x: number; readonly y: number };
};

const glowPropertyFormatters: EffectPropertyFormatterMap<
    GlowCssPropertyName,
    GlowFormatterContext
> = {
    shadowOpacity: (context) =>
        formatShadow(context.color, context.focal ?? fallbackFocal),
    opacity: () => formatOpacityValue,
    brightness: () => formatBrightnessValue,
};

export const glowEffect = createEffectDefinition({
    spec: glowAnimationSpec,
    trackSequence: TRACK_SEQUENCE,
    animationNames: glowAnimationNames,
    propertyFormatters: glowPropertyFormatters,
    propertyDeclarations: glowCssPropertyDeclarations(),
    cssVariables: glowCssVariables,
});

export const evaluateGlowTrack = glowEffect.evaluateTrack;
export const getGlowCssPropertyValue = glowEffect.evaluateProperty;
export const getGlowCssValues = glowEffect.evaluateAllProperties;
export const sampleGlowCssPropertyTimeline = glowEffect.samplePropertyTimeline;
export const getGlowAnimationDelays = glowEffect.getAnimationDelays;

export const getGlowTrackValue = (
    track: GlowAnimationTrackName,
    elapsedSeconds: number
): number => evaluateGlowTrack(track, elapsedSeconds);

export const getGlowPrimaryValue = (elapsedSeconds: number): number =>
    getGlowTrackValue('primary', elapsedSeconds);

export { formatCubicBezier } from '../../animation/easing';
