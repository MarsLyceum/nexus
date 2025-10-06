const isFiniteNumber = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value);

const parseNumber = (candidate: unknown): number | undefined => {
    if (isFiniteNumber(candidate)) {
        return candidate;
    }
    if (typeof candidate === 'string') {
        const parsed = Number(candidate);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
};

export const extractNumberFromArrayAt = (
    data: unknown,
    index: number
): number | undefined => {
    if (!ArrayBuffer.isView(data)) {
        return undefined;
    }
    const view = data as unknown as ArrayLike<unknown>;
    if (view.length <= index) {
        return undefined;
    }
    return parseNumber(view[index]);
};

export const extractNumberFromRecord = (
    data: unknown,
    key: string
): number | undefined => {
    if (typeof data !== 'object' || data === null) {
        return undefined;
    }
    const record = data as Record<string, unknown>;
    return parseNumber(record[key]);
};

export const formatNumber = (value: number, precision = 6): string =>
    value.toFixed(precision);

export const createFrameCounter = () => {
    let count = 0;
    return () => {
        count += 1;
        return count;
    };
};
