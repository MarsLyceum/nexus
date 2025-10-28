import { clamp01, iterate } from '../utils/math';

export type CubicBezierControlPoints = {
    readonly x1: number;
    readonly y1: number;
    readonly x2: number;
    readonly y2: number;
};

export type EasingFunction = (progress: number) => number;

type BezierCoefficients = {
    readonly ax: number;
    readonly bx: number;
    readonly cx: number;
};

const toCoefficients = ({
    x1,
    x2,
}: Pick<CubicBezierControlPoints, 'x1' | 'x2'>): BezierCoefficients => {
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    return { ax, bx, cx };
};

const sampleCurve = (t: number, coefficients: BezierCoefficients): number =>
    ((coefficients.ax * t + coefficients.bx) * t + coefficients.cx) * t;

const sampleCurveDerivative = (
    t: number,
    coefficients: BezierCoefficients
): number =>
    (3 * coefficients.ax * t + 2 * coefficients.bx) * t + coefficients.cx;

export const buildCubicBezier = ({
    x1,
    y1,
    x2,
    y2,
}: CubicBezierControlPoints): EasingFunction => {
    if (x1 === y1 && x2 === y2) {
        return (progress: number) => progress;
    }

    const xCoefficients = toCoefficients({ x1, x2 });
    const yCoefficients = toCoefficients({ x1: y1, x2: y2 });
    const epsilon = 1e-6;

    const solveCurveX = (progress: number): number => {
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

export const formatCubicBezier = ({
    x1,
    y1,
    x2,
    y2,
}: CubicBezierControlPoints): string =>
    `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;
