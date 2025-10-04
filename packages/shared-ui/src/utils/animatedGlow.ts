import { Platform } from 'react-native';

import {
    glowAnimationSpec,
    getGlowAnimationDelays,
    formatCubicBezier,
    GlowCssPropertyName,
    sampleGlowCssPropertyTimeline,
    TRACK_SEQUENCE,
    GLOW_INTENSITY_SCALE,
    WEBGPU_GLOW_OUTER_PAD_PX,
    GLOW_RIM_BOOST,
    GLOW_RIM_SPREAD,
    GLOW_RIM_WIDTH_SCALE,
} from '../animation/glowSpec';

export type WebGlowAnimationStyle = {
    readonly style: Record<string, string>;
    readonly dataSet: Record<string, string>;
};

const emptyWebGlowAnimationStyle: WebGlowAnimationStyle = {
    style: {},
    dataSet: {},
};

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
        };
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
    };
};

type GlowFocalPoint = { readonly x: number; readonly y: number };

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

type ShadowLayerDefinition = {
    readonly offsetX: number;
    readonly offsetY: number;
    readonly blur: number;
    readonly spread: number;
    readonly weight: number;
    readonly rim: boolean;
};

type ShadowLayer = ShadowLayerDefinition & { readonly alpha: number };

const CSS_SHADOW_INTENSITY = GLOW_INTENSITY_SCALE;

const createLayerSet = (
    opacity: number,
    definitions: ReadonlyArray<ShadowLayerDefinition>
): ReadonlyArray<ShadowLayer> => {
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
            };
        }
        return {
            ...definition,
            alpha: (baseAlpha * definition.weight) / segmentTotal,
        };
    });
};

const formatLayer = (
    layer: ShadowLayer,
    rgbExpression: string,
    scaleExpression: string
) => {
    const baseAlphaExpression = formatAlphaExpression(
        layer.alpha,
        scaleExpression
    );
    const alphaValue = layer.rim
        ? formatAlphaExpression(layer.alpha * RIM_WEIGHT_SCALE, scaleExpression)
        : baseAlphaExpression;
    return `${roundPx(layer.offsetX)} ${roundPx(layer.offsetY)} ${roundPx(
        layer.blur
    )} ${roundPx(layer.spread)} rgba(${rgbExpression}, ${alphaValue})`;
};

const SHADOW_PAD_PX = WEBGPU_GLOW_OUTER_PAD_PX;
const RIM_WIDTH_PX = GLOW_RIM_SPREAD * GLOW_RIM_WIDTH_SCALE;
const RIM_WEIGHT_SCALE = GLOW_RIM_BOOST;

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
    };
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
        .map((layer) => formatLayer(layer, rgbExpression, scaleExpression))
        .join(', ');
};

const toPercent = (ratio: number) => `${Math.round(ratio * 100)}%`;

const formatShadow =
    (color: string, focal?: GlowFocalPoint) => (value: number) => {
        const intensityExpression =
            'var(--glow-alpha, 1) * var(--glow-brightness, 1)';
        const shadowLayers = createShadowLayers(color, value, {
            focal,
            intensityScaleExpression: intensityExpression,
        });
        return `box-shadow: ${shadowLayers};`;
    };

const formatOpacityValue = (value: number) =>
    `--glow-alpha: ${(value * GLOW_INTENSITY_SCALE).toFixed(3)};`;

const formatBrightnessValue = (value: number) =>
    `--glow-brightness: ${value.toFixed(3)};`;

const declareProperty = (name: string, initial: number) => `@property ${name} {
            syntax: '<number>';
            inherits: false;
                        initial-value: ${initial.toFixed(3)};
        }`;

export type GlowKeyframesOptions = {
    readonly focal?: GlowFocalPoint;
};

export const createGlowKeyframes = (
    color: string,
    options: GlowKeyframesOptions = {}
) => {
    const { opacity, brightness } = glowAnimationSpec.css;
    const formatters: Record<GlowCssPropertyName, (value: number) => string> = {
        shadowOpacity: formatShadow(color, options.focal),
        opacity: formatOpacityValue,
        brightness: formatBrightnessValue,
    };
    const buildKeyframeBlock = (property: GlowCssPropertyName) =>
        sampleGlowCssPropertyTimeline(property, 120)
            .map(({ ratio, value }) => {
                const formatter = formatters[property];
                return `${toPercent(ratio)} { ${formatter(value)} }`;
            })
            .join('\n');

    return `
        ${declareProperty('--glow-alpha', opacity.min)}
        ${declareProperty('--glow-brightness', brightness.min)}

        @keyframes breathingGlowPrimary {
${buildKeyframeBlock('shadowOpacity')}
        }

        @keyframes breathingGlowSecondary {
${buildKeyframeBlock('opacity')}
        }

        @keyframes breathingGlowTertiary {
${buildKeyframeBlock('brightness')}
        }
    `;
};

const createTimingFns = () =>
    TRACK_SEQUENCE.map((track) =>
        formatCubicBezier(glowAnimationSpec.tracks[track].easing)
    ).join(', ');

const trackAnimationNames: Record<(typeof TRACK_SEQUENCE)[number], string> = {
    primary: 'breathingGlowPrimary',
    secondaryOpacity: 'breathingGlowSecondary',
    tertiaryBrightness: 'breathingGlowTertiary',
};

const toSeconds = (value: number) => `${value.toFixed(3)}s`;

export const createWebGlowAnimationStyle = (
    elapsedSeconds = 0
): WebGlowAnimationStyle => {
    if (Platform.OS !== 'web') {
        return emptyWebGlowAnimationStyle;
    }

    const nameValue = TRACK_SEQUENCE.map(
        (track) => trackAnimationNames[track]
    ).join(', ');

    const durationValue = TRACK_SEQUENCE.map((track) =>
        toSeconds(glowAnimationSpec.tracks[track].durationSeconds)
    ).join(', ');

    return {
        style: {
            animationName: nameValue,
            animationDuration: durationValue,
            animationTimingFunction: createTimingFns(),
            animationIterationCount: TRACK_SEQUENCE.map(() => 'infinite').join(
                ', '
            ),
            animationFillMode: TRACK_SEQUENCE.map(() => 'both').join(', '),
            animationDelay: getGlowAnimationDelays(elapsedSeconds),
            '--glow-alpha': glowAnimationSpec.css.opacity.min.toFixed(3),
            '--glow-brightness':
                glowAnimationSpec.css.brightness.min.toFixed(3),
        },
        dataSet: {
            glowAnimation: nameValue,
            glowDuration: durationValue,
        },
    };
};
