export const clamp = (value: number, min: number, max: number): number =>
    Math.min(max, Math.max(min, value));

export const clamp01 = (value: number): number => clamp(value, 0, 1);

export const lerp = (start: number, end: number, amount: number): number =>
    start + (end - start) * amount;

export const modulo = (value: number, period: number): number => {
    if (!Number.isFinite(period) || period === 0) {
        return 0;
    }
    const remainder = value % period;
    return remainder < 0 ? remainder + period : remainder;
};

export const iterate = <State>(
    count: number,
    initial: State,
    step: (state: State, index: number) => State
): State => {
    const recur = (index: number, state: State): State =>
        index >= count ? state : recur(index + 1, step(state, index));
    return recur(0, initial);
};

export const mapRange = (
    value: number,
    fromMin: number,
    fromMax: number,
    toMin: number,
    toMax: number
): number => {
    const normalized = (value - fromMin) / (fromMax - fromMin);
    return toMin + (toMax - toMin) * normalized;
};

export const mapRangeValue = (
    range: { readonly min: number; readonly max: number },
    normalized: number
): number => {
    const clamped = clamp01(normalized);
    return range.min + (range.max - range.min) * clamped;
};
