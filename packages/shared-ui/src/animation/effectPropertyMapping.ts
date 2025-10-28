import { mapRangeValue, modulo } from '../utils/math';
import {
    createAnimationSpec,
    type AnimationTrackSpec,
    type ValueRange,
} from './tracks';
import { entries } from './helpers/object';

export type PropertyTrackMapping<TrackName extends string> = {
    readonly range: ValueRange;
    readonly trackName: TrackName;
};

export type EffectAnimationSpec<
    TrackName extends string,
    PropertyName extends string,
> = {
    readonly tracks: Record<TrackName, AnimationTrackSpec>;
    readonly properties: Record<PropertyName, PropertyTrackMapping<TrackName>>;
};

type PropertyValues<PropertyName extends string> = Record<PropertyName, number>;

type EffectSpecEvaluator<
    TrackName extends string,
    PropertyName extends string,
> = {
    readonly spec: EffectAnimationSpec<TrackName, PropertyName>;
    readonly trackEvaluators: Record<
        TrackName,
        (elapsedSeconds: number) => number
    >;
    readonly evaluateTrack: (
        track: TrackName,
        elapsedSeconds: number
    ) => number;
    readonly evaluateProperty: (
        property: PropertyName,
        elapsedSeconds: number
    ) => number;
    readonly evaluateAllProperties: (
        elapsedSeconds: number
    ) => PropertyValues<PropertyName>;
    readonly samplePropertyTimeline: (
        property: PropertyName,
        resolution?: number
    ) => ReadonlyArray<{ readonly ratio: number; readonly value: number }>;
    readonly getAnimationDelays: (elapsedSeconds: number) => string;
};

const createPropertyEvaluator =
    <TrackName extends string, PropertyName extends string>(
        spec: EffectAnimationSpec<TrackName, PropertyName>,
        trackEvaluators: Record<TrackName, (elapsedSeconds: number) => number>
    ) =>
    (property: PropertyName, elapsedSeconds: number): number => {
        const mapping = spec.properties[property];
        const { trackName } = mapping;
        const evaluator = trackEvaluators[trackName];
        const normalized = evaluator(elapsedSeconds);
        return mapRangeValue(mapping.range, normalized);
    };

const createAllPropertiesEvaluator =
    <TrackName extends string, PropertyName extends string>(
        spec: EffectAnimationSpec<TrackName, PropertyName>,
        evaluateProperty: (
            property: PropertyName,
            elapsedSeconds: number
        ) => number
    ) =>
    (elapsedSeconds: number): PropertyValues<PropertyName> => {
        const propertyEntries = entries(spec.properties);
        return propertyEntries.reduce(
            (accumulated, [property]) => ({
                ...accumulated,
                [property]: evaluateProperty(property, elapsedSeconds),
            }),
            {} as PropertyValues<PropertyName>
        );
    };

const createPropertyTimelineSampler =
    <TrackName extends string, PropertyName extends string>(
        spec: EffectAnimationSpec<TrackName, PropertyName>,
        evaluateProperty: (
            property: PropertyName,
            elapsedSeconds: number
        ) => number
    ) =>
    (
        property: PropertyName,
        resolution = 120
    ): ReadonlyArray<{ readonly ratio: number; readonly value: number }> => {
        const mapping = spec.properties[property];
        const { trackName } = mapping;
        const trackSpec = spec.tracks[trackName];
        const sample = (
            ratio: number
        ): { readonly ratio: number; readonly value: number } => {
            const clampedRatio = Math.min(1, Math.max(0, ratio));
            const elapsed = clampedRatio * trackSpec.durationSeconds;
            return {
                ratio: clampedRatio,
                value: evaluateProperty(property, elapsed),
            };
        };
        return Array.from({ length: resolution + 1 }, (_, index) =>
            sample(index / resolution)
        );
    };

const createAnimationDelayCalculator =
    <TrackName extends string>(
        spec: EffectAnimationSpec<TrackName, string>,
        trackSequence: ReadonlyArray<TrackName>
    ) =>
    (elapsedSeconds: number): string =>
        trackSequence
            .map((trackName) => {
                const duration = spec.tracks[trackName].durationSeconds;
                if (duration <= 0) {
                    return '0s';
                }
                const normalized = modulo(elapsedSeconds, duration);
                return `-${normalized.toFixed(3)}s`;
            })
            .join(', ');

export const createEffectAnimationEvaluator = <
    TrackName extends string,
    PropertyName extends string,
>(
    spec: EffectAnimationSpec<TrackName, PropertyName>,
    trackSequence: ReadonlyArray<TrackName>
): EffectSpecEvaluator<TrackName, PropertyName> => {
    const { evaluators: trackEvaluators } = createAnimationSpec<TrackName>({
        tracks: spec.tracks,
    });

    const evaluateTrack = (track: TrackName, elapsedSeconds: number): number =>
        trackEvaluators[track](elapsedSeconds);

    const evaluateProperty = createPropertyEvaluator(spec, trackEvaluators);
    const evaluateAllProperties = createAllPropertiesEvaluator(
        spec,
        evaluateProperty
    );
    const samplePropertyTimeline = createPropertyTimelineSampler(
        spec,
        evaluateProperty
    );
    const getAnimationDelays = createAnimationDelayCalculator(
        spec,
        trackSequence
    );

    return {
        spec,
        trackEvaluators,
        evaluateTrack,
        evaluateProperty,
        evaluateAllProperties,
        samplePropertyTimeline,
        getAnimationDelays,
    };
};
