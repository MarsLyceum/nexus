import { Platform } from 'react-native';

import { formatCubicBezier } from './easing';
import type { EffectAnimationSpec } from './effectPropertyMapping';

export type CssAnimationStyle = {
    readonly style: Record<string, string>;
    readonly dataSet: Record<string, string>;
};

const emptyCssAnimationStyle: CssAnimationStyle = {
    style: {},
    dataSet: {},
};

const toPercent = (ratio: number) => `${Math.round(ratio * 100)}%`;

const toSeconds = (value: number) => `${value.toFixed(3)}s`;

type KeyframeFormatter<PropertyName extends string> = (
    property: PropertyName,
    value: number
) => string;

type CssKeyframesConfig<
    TrackName extends string,
    PropertyName extends string,
> = {
    readonly animationNames: Record<TrackName, string>;
    readonly propertyDeclarations?: ReadonlyArray<string>;
    readonly formatKeyframe: KeyframeFormatter<PropertyName>;
    readonly samplePropertyTimeline: (
        property: PropertyName,
        resolution?: number
    ) => ReadonlyArray<{ readonly ratio: number; readonly value: number }>;
};

const buildKeyframeBlock = <PropertyName extends string>(
    property: PropertyName,
    sampleTimeline: (
        property: PropertyName,
        resolution?: number
    ) => ReadonlyArray<{ readonly ratio: number; readonly value: number }>,
    formatKeyframe: KeyframeFormatter<PropertyName>,
    resolution = 120
): string =>
    sampleTimeline(property, resolution)
        .map(
            ({ ratio, value }) =>
                `${toPercent(ratio)} { ${formatKeyframe(property, value)} }`
        )
        .join('\n');

export const createCssKeyframes = <
    TrackName extends string,
    PropertyName extends string,
>(
    config: CssKeyframesConfig<TrackName, PropertyName>,
    propertyToTrack: Record<PropertyName, TrackName>
): string => {
    const declarations = config.propertyDeclarations ?? [];
    const propertyNames = Object.keys(
        propertyToTrack
    ) as ReadonlyArray<PropertyName>;

    const keyframeBlocks = propertyNames
        .map((property) => {
            const trackName = propertyToTrack[property];
            const animationName = config.animationNames[trackName];
            const block = buildKeyframeBlock(
                property,
                config.samplePropertyTimeline,
                config.formatKeyframe
            );
            return `@keyframes ${animationName} {\n${block}\n}`;
        })
        .join('\n\n');

    return declarations.length > 0
        ? `${declarations.join('\n')}\n\n${keyframeBlocks}`
        : keyframeBlocks;
};

type CssAnimationStyleConfig<TrackName extends string> = {
    readonly trackSequence: ReadonlyArray<TrackName>;
    readonly animationNames: Record<TrackName, string>;
    readonly spec: EffectAnimationSpec<TrackName, string>;
    readonly getAnimationDelays: (elapsedSeconds: number) => string;
    readonly cssVariables?: Record<string, string | number>;
};

const createTimingFunctions = <TrackName extends string>(
    spec: EffectAnimationSpec<TrackName, string>,
    trackSequence: ReadonlyArray<TrackName>
): string =>
    trackSequence
        .map((track) => formatCubicBezier(spec.tracks[track].easing))
        .join(', ');

export const createCssAnimationStyle = <TrackName extends string>(
    config: CssAnimationStyleConfig<TrackName>,
    elapsedSeconds = 0
): CssAnimationStyle => {
    if (Platform.OS !== 'web') {
        return emptyCssAnimationStyle;
    }

    const nameValue = config.trackSequence
        .map((track) => config.animationNames[track])
        .join(', ');

    const durationValue = config.trackSequence
        .map((track) => toSeconds(config.spec.tracks[track].durationSeconds))
        .join(', ');

    const style: Record<string, string> = {
        animationName: nameValue,
        animationDuration: durationValue,
        animationTimingFunction: createTimingFunctions(
            config.spec,
            config.trackSequence
        ),
        animationIterationCount: config.trackSequence
            .map(() => 'infinite')
            .join(', '),
        animationFillMode: config.trackSequence.map(() => 'both').join(', '),
        animationDelay: config.getAnimationDelays(elapsedSeconds),
    };

    if (config.cssVariables) {
        Object.entries(config.cssVariables).forEach(([key, value]) => {
            style[key] =
                typeof value === 'number' ? value.toFixed(3) : String(value);
        });
    }

    return {
        style,
        dataSet: {
            animation: nameValue,
            duration: durationValue,
        },
    };
};

export const createCssPropertyDeclaration = (
    name: string,
    initial: number
): string => `@property ${name} {
    syntax: '<number>';
    inherits: false;
    initial-value: ${initial.toFixed(3)};
}`;
