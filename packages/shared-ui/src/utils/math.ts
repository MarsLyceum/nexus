export const clamp = (value: number, min: number, max: number): number =>
    Math.min(max, Math.max(min, value));

export const clamp01 = (value: number): number => clamp(value, 0, 1);

export const lerp = (start: number, end: number, amount: number): number =>
    start + (end - start) * amount;
