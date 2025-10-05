import { clamp01, modulo } from '../utils/math';
import {
    buildCubicBezier,
    type CubicBezierControlPoints,
    type EasingFunction,
} from './easing';

export type AnimationKeyframe = {
    readonly at: number;
    readonly value: number;
};

export type AnimationTrackSpec = {
    readonly durationSeconds: number;
    readonly keyframes: ReadonlyArray<AnimationKeyframe>;
    readonly easing: CubicBezierControlPoints;
};

export type ValueRange = {
    readonly min: number;
    readonly max: number;
};

export type TrackEvaluator = (elapsedSeconds: number) => number;

const preprocessKeyframes = (
    keyframes: ReadonlyArray<AnimationKeyframe>
): ReadonlyArray<AnimationKeyframe> =>
    keyframes
        .filter((frame) => Number.isFinite(frame.at))
        .filter((frame) => Number.isFinite(frame.value))
        .sort((left, right) => left.at - right.at);

const evaluateTrackValue = (
    spec: AnimationTrackSpec,
    elapsedSeconds: number,
    easingFn: EasingFunction,
    keyframes: ReadonlyArray<AnimationKeyframe>
): number => {
    if (keyframes.length === 0) {
        return 0;
    }

    if (spec.durationSeconds <= 0 || !Number.isFinite(spec.durationSeconds)) {
        return keyframes[0]?.value ?? 0;
    }

    if (keyframes.length === 1) {
        return keyframes[0].value;
    }

    const clampedElapsed = modulo(elapsedSeconds, spec.durationSeconds);
    const normalized =
        spec.durationSeconds > 0 ? clampedElapsed / spec.durationSeconds : 0;

    if (normalized <= keyframes[0].at) {
        return keyframes[0].value;
    }

    const lastFrame = keyframes.at(-1);
    if (!lastFrame) {
        return 0;
    }

    if (normalized >= lastFrame.at) {
        return lastFrame.value;
    }

    const nextIndex = keyframes.findIndex((frame) => normalized <= frame.at);
    const upperIndex = nextIndex <= 0 ? 1 : nextIndex;
    const lowerIndex = upperIndex - 1;

    const lower = keyframes.at(lowerIndex);
    const upper = keyframes.at(upperIndex);

    if (!lower || !upper) {
        return 0;
    }

    const span = upper.at - lower.at;
    if (span <= 0) {
        return upper.value;
    }

    const localNormalized = (normalized - lower.at) / span;
    const eased = easingFn(clamp01(localNormalized));

    return lower.value + (upper.value - lower.value) * eased;
};

export const createTrackEvaluator = (
    spec: AnimationTrackSpec
): TrackEvaluator => {
    const easingFn = buildCubicBezier(spec.easing);
    const keyframes = preprocessKeyframes(spec.keyframes);
    return (elapsedSeconds: number) =>
        evaluateTrackValue(spec, elapsedSeconds, easingFn, keyframes);
};

export const createAnimationSpec = <TrackName extends string>(config: {
    readonly tracks: Record<TrackName, AnimationTrackSpec>;
}): {
    readonly tracks: Record<TrackName, AnimationTrackSpec>;
    readonly evaluators: Record<TrackName, TrackEvaluator>;
} => {
    const trackNames = Object.keys(
        config.tracks
    ) as unknown as ReadonlyArray<TrackName>;
    const evaluators = trackNames.reduce(
        (accumulated, trackName) => ({
            ...accumulated,
            [trackName]: createTrackEvaluator(config.tracks[trackName]),
        }),
        {} as Record<TrackName, TrackEvaluator>
    );

    return {
        tracks: config.tracks,
        evaluators,
    };
};
