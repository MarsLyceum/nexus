import type { CssAnimationStyle } from './cssAnimationUtils';
import {
    createCssAnimationStyle,
    createCssKeyframes,
} from './cssAnimationUtils';
import type {
    EffectAnimationSpec,
    PropertyMapping,
} from './effectPropertyMapping';

type Formatter<PropertyName extends string> = (value: number) => string;

type AnimationNames<TrackName extends string> = Record<TrackName, string>;

const mapPropertyTrack = <
    TrackName extends string,
    PropertyName extends string,
>(
    spec: EffectAnimationSpec<TrackName, PropertyName>
): Record<PropertyName, TrackName> =>
    (Object.keys(spec.properties) as ReadonlyArray<PropertyName>).reduce(
        (accumulated, property) => ({
            ...accumulated,
            [property]: spec.properties[property].trackName as TrackName,
        }),
        {} as Record<PropertyName, TrackName>
    );

export type EffectCssKeyframesConfig<
    TrackName extends string,
    PropertyName extends string,
> = {
    readonly spec: EffectAnimationSpec<TrackName, PropertyName>;
    readonly animationNames: AnimationNames<TrackName>;
    readonly propertyFormatters: Record<PropertyName, Formatter<PropertyName>>;
    readonly propertyDeclarations?: ReadonlyArray<string>;
    readonly samplePropertyTimeline: (
        property: PropertyName,
        resolution?: number
    ) => ReadonlyArray<{ readonly ratio: number; readonly value: number }>;
};

export const createEffectCssKeyframes = <
    TrackName extends string,
    PropertyName extends string,
>({
    spec,
    animationNames,
    propertyFormatters,
    propertyDeclarations,
    samplePropertyTimeline,
}: EffectCssKeyframesConfig<TrackName, PropertyName>): string => {
    const propertyToTrack = mapPropertyTrack(spec);
    return createCssKeyframes(
        {
            animationNames,
            propertyDeclarations,
            formatKeyframe: (property, value) =>
                propertyFormatters[property](value),
            samplePropertyTimeline,
        },
        propertyToTrack
    );
};

export type EffectCssAnimationStyleConfig<TrackName extends string> = {
    readonly spec: EffectAnimationSpec<TrackName, string>;
    readonly trackSequence: ReadonlyArray<TrackName>;
    readonly animationNames: AnimationNames<TrackName>;
    readonly getAnimationDelays: (elapsedSeconds: number) => string;
    readonly cssVariables?: Record<string, number | string>;
};

export const createEffectCssAnimationStyle = <TrackName extends string>(
    config: EffectCssAnimationStyleConfig<TrackName>,
    elapsedSeconds = 0
): CssAnimationStyle =>
    createCssAnimationStyle(
        {
            trackSequence: config.trackSequence,
            animationNames: config.animationNames,
            spec: config.spec,
            getAnimationDelays: config.getAnimationDelays,
            cssVariables: config.cssVariables,
        },
        elapsedSeconds
    );

export const mapPropertyRange = <PropertyName extends string>(
    mapping: PropertyMapping<PropertyName>
) => mapping.range;
