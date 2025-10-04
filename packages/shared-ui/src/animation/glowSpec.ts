export const WEBGPU_GLOW_OUTER_PAD_PX = 144;
export const GLOW_RIM_BOOST = 1.75;
export const GLOW_RIM_SPREAD = 28;
export const GLOW_RIM_WIDTH_SCALE = 1;
export const GLOW_NOISE_MIX = 8;
export const GLOW_INTENSITY_SCALE = 0.65;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const modulo = (value: number, period: number): number => {
    if (!Number.isFinite(period) || period === 0) {
        return 0;
    }
    const remainder = value % period;
    return remainder < 0 ? remainder + period : remainder;
};

const iterate = <State>(
    count: number,
    initial: State,
    step: (state: State, index: number) => State
): State => {
    const recur = (index: number, state: State): State =>
        index >= count ? state : recur(index + 1, step(state, index));
    return recur(0, initial);
};

type CubicBezierControlPoints = {
    readonly x1: number;
    readonly y1: number;
    readonly x2: number;
    readonly y2: number;
};

type GlowTrackKeyframe = {
    readonly at: number;
    readonly value: number;
};

export type GlowAnimationTrackSpec = {
    readonly durationSeconds: number;
    readonly keyframes: ReadonlyArray<GlowTrackKeyframe>;
    readonly easing: CubicBezierControlPoints;
};

export type GlowAnimationTrackName =
    | 'primary'
    | 'secondaryOpacity'
    | 'tertiaryBrightness';

export type GlowCssPropertyName = 'shadowOpacity' | 'opacity' | 'brightness';

export type GlowCssRange = { readonly min: number; readonly max: number };

export type GlowAnimationSpec = {
    readonly tracks: Record<GlowAnimationTrackName, GlowAnimationTrackSpec>;
    readonly css: Record<GlowCssPropertyName, GlowCssRange>;
};

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

const mapRangeValue = (range: GlowCssRange, normalized: number) => {
    const clamped = clamp01(normalized);
    return range.min + (range.max - range.min) * clamped;
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

export const getGlowCssPropertyValue = (
    property: GlowCssPropertyName,
    elapsedSeconds: number
): number => {
    const track = cssPropertyToTrack[property];
    const normalized = evaluateGlowTrack(track, elapsedSeconds);
    const range = glowAnimationSpec.css[property];
    return mapRangeValue(range, normalized);
};

export const getGlowCssValues = (elapsedSeconds: number): GlowCssValue =>
    TRACK_SEQUENCE.reduce(
        (accumulated, track) => {
            const cssProperty = trackToCssProperty[track];
            return {
                ...accumulated,
                [cssProperty]: getGlowCssPropertyValue(
                    cssProperty,
                    elapsedSeconds
                ),
            };
        },
        {
            shadowOpacity: glowAnimationSpec.css.shadowOpacity.min,
            opacity: glowAnimationSpec.css.opacity.min,
            brightness: glowAnimationSpec.css.brightness.min,
        }
    );

const toCoefficients = ({
    x1,
    x2,
}: Pick<CubicBezierControlPoints, 'x1' | 'x2'>): {
    readonly ax: number;
    readonly bx: number;
    readonly cx: number;
} => {
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    return { ax, bx, cx };
};

const sampleCurve = (
    t: number,
    coefficients: {
        readonly ax: number;
        readonly bx: number;
        readonly cx: number;
    }
) => ((coefficients.ax * t + coefficients.bx) * t + coefficients.cx) * t;

const sampleCurveDerivative = (
    t: number,
    coefficients: {
        readonly ax: number;
        readonly bx: number;
        readonly cx: number;
    }
) => (3 * coefficients.ax * t + 2 * coefficients.bx) * t + coefficients.cx;

const buildCubicBezier = ({ x1, y1, x2, y2 }: CubicBezierControlPoints) => {
    if (x1 === y1 && x2 === y2) {
        return (progress: number) => progress;
    }
    const xCoefficients = toCoefficients({ x1, x2 });
    const yCoefficients = toCoefficients({ x1: y1, x2: y2 });
    const epsilon = 1e-6;
    const solveCurveX = (progress: number) => {
        const initialGuess = clamp01(progress);
        const newton = iterate(8, initialGuess, (state) => {
            const derivative = sampleCurveDerivative(state, xCoefficients);
            if (Math.abs(derivative) < epsilon) {
                return state;
            }
            const delta =
                (sampleCurve(state, xCoefficients) - progress) / derivative;
            return clamp01(state - delta);
        });
        const newtonResult = sampleCurve(newton, xCoefficients);
        if (Math.abs(newtonResult - progress) < epsilon) {
            return newton;
        }
        const binarySearch = (lower: number, upper: number): number => {
            if (upper - lower <= epsilon) {
                return (lower + upper) * 0.5;
            }
            const mid = (lower + upper) * 0.5;
            const estimate = sampleCurve(mid, xCoefficients);
            if (estimate > progress) {
                return binarySearch(lower, mid);
            }
            return binarySearch(mid, upper);
        };
        return binarySearch(0, 1);
    };
    return (progress: number) => {
        if (progress <= 0) {
            return 0;
        }
        if (progress >= 1) {
            return 1;
        }
        const param = solveCurveX(progress);
        return clamp01(sampleCurve(param, yCoefficients));
    };
};

const preprocessKeyframes = (
    keyframes: ReadonlyArray<GlowTrackKeyframe>
): ReadonlyArray<GlowTrackKeyframe> =>
    keyframes
        .filter((frame) => Number.isFinite(frame.at))
        .filter((frame) => Number.isFinite(frame.value))
        .sort((left, right) => left.at - right.at);

const evaluateTrackValue = (
    spec: GlowAnimationTrackSpec,
    elapsedSeconds: number,
    easingFn: (value: number) => number,
    keyframes: ReadonlyArray<GlowTrackKeyframe>
) => {
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

const createTrackEvaluator = (spec: GlowAnimationTrackSpec) => {
    const easingFn = buildCubicBezier(spec.easing);
    const keyframes = preprocessKeyframes(spec.keyframes);
    return (elapsedSeconds: number) =>
        evaluateTrackValue(spec, elapsedSeconds, easingFn, keyframes);
};

export const glowAnimationSpec: GlowAnimationSpec = {
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
    css: {
        shadowOpacity: { min: 0.28, max: 0.9 },
        opacity: { min: 0.85, max: 1 },
        brightness: { min: 1, max: 1.04 },
    },
};

const glowTrackEvaluators: Record<
    GlowAnimationTrackName,
    (elapsedSeconds: number) => number
> = {
    primary: createTrackEvaluator(glowAnimationSpec.tracks.primary),
    secondaryOpacity: createTrackEvaluator(
        glowAnimationSpec.tracks.secondaryOpacity
    ),
    tertiaryBrightness: createTrackEvaluator(
        glowAnimationSpec.tracks.tertiaryBrightness
    ),
};

export const evaluateGlowTrack = (
    track: GlowAnimationTrackName,
    elapsedSeconds: number
) => glowTrackEvaluators[track](elapsedSeconds);

export type GlowCssTimelineSample = {
    readonly ratio: number;
    readonly value: number;
};

export const sampleGlowCssPropertyTimeline = (
    property: GlowCssPropertyName,
    resolution = 120
): ReadonlyArray<GlowCssTimelineSample> => {
    const track = cssPropertyToTrack[property];
    const spec = glowAnimationSpec.tracks[track];
    const sample = (ratio: number): GlowCssTimelineSample => {
        const clampedRatio = clamp01(ratio);
        const elapsed = clampedRatio * spec.durationSeconds;
        return {
            ratio: clampedRatio,
            value: getGlowCssPropertyValue(property, elapsed),
        };
    };
    return Array.from({ length: resolution + 1 }, (_, index) =>
        sample(index / resolution)
    );
};

export const formatCubicBezier = ({
    x1,
    y1,
    x2,
    y2,
}: CubicBezierControlPoints): string =>
    `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;

export const getGlowAnimationDelays = (elapsedSeconds: number) =>
    [
        glowAnimationSpec.tracks.primary.durationSeconds,
        glowAnimationSpec.tracks.secondaryOpacity.durationSeconds,
        glowAnimationSpec.tracks.tertiaryBrightness.durationSeconds,
    ]
        .map((duration) => {
            if (duration <= 0) {
                return '0s';
            }
            const normalized = modulo(elapsedSeconds, duration);
            return `-${normalized.toFixed(3)}s`;
        })
        .join(', ');

export const getGlowTrackValue = (
    track: GlowAnimationTrackName,
    elapsedSeconds: number
) => evaluateGlowTrack(track, elapsedSeconds);

export const getGlowPrimaryValue = (elapsedSeconds: number) =>
    getGlowTrackValue('primary', elapsedSeconds);
