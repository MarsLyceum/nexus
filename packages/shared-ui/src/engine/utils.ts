import { Backend, EngineState } from './types';

export const now = (): number => Date.now();

const unique = <Value>(values: ReadonlyArray<Value>): Value[] =>
    values.filter(
        (value, index, collection) => collection.indexOf(value) === index
    );

export const mergeState = <State extends EngineState>(
    current: State,
    patch: Partial<State>
): State => ({
    ...current,
    ...patch,
});

export const buildBackendOrder = <UniformData>(
    available: ReadonlyArray<Backend<UniformData>>,
    preference?: ReadonlyArray<string>
): string[] => {
    const availableIds = available.map((backend) => backend.id);
    const preferredIds =
        preference && preference.length > 0 ? unique(preference) : availableIds;
    const fallback = availableIds.filter((id) => !preferredIds.includes(id));
    return [...preferredIds, ...fallback];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const getStringProperty = (
    record: Record<string, unknown>,
    key: string
): string | undefined => {
    const value = record[key];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
};

const safeJson = (value: unknown): string | undefined => {
    try {
        const serialized = JSON.stringify(value);
        return typeof serialized === 'string' ? serialized : undefined;
    } catch {
        return undefined;
    }
};

const normalizeRecordError = (record: Record<string, unknown>): Error => {
    const primaryMessage = [
        getStringProperty(record, 'message'),
        getStringProperty(record, 'reason'),
        getStringProperty(record, 'detail'),
        getStringProperty(record, 'description'),
    ].find((candidate) => candidate !== undefined);
    const fallbackMessage = safeJson(record) ?? '[object Object]';
    const error = new Error(primaryMessage ?? fallbackMessage);
    const inferredName = getStringProperty(record, 'name');
    if (inferredName) {
        error.name = inferredName;
    }
    const inferredStack = getStringProperty(record, 'stack');
    if (inferredStack) {
        error.stack = inferredStack;
    }
    if ('cause' in record) {
        (error as Error & { cause?: unknown }).cause = (
            record as {
                cause?: unknown;
            }
        ).cause;
    }
    return error;
};

export const toError = (value: unknown): Error => {
    if (value instanceof Error) {
        return value;
    }
    if (typeof DOMException !== 'undefined' && value instanceof DOMException) {
        const message = `${value.name}: ${value.message}`;
        const error = new Error(message);
        error.name = value.name;
        error.stack = value.stack;
        return error;
    }
    if (isRecord(value)) {
        return normalizeRecordError(value);
    }
    return new Error(String(value));
};

export const scheduleNextFrame = (callback: FrameRequestCallback): number =>
    requestAnimationFrame(callback);

export const cancelScheduledFrame = (frameId: number) =>
    cancelAnimationFrame(frameId);
