const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const WGSL_VALUE_KEYS = [
    'default',
    'code',
    'source',
    'wgsl',
    'text',
    'data',
    'raw',
    'contents',
    'body',
    'File',
] as const;

const isArrayBufferView = (value: unknown): value is ArrayBufferView =>
    typeof value === 'object' && value !== null && ArrayBuffer.isView(value);

let cachedTextDecoder: TextDecoder | undefined;

const getTextDecoder = () => {
    if (cachedTextDecoder) {
        return cachedTextDecoder;
    }
    if (typeof TextDecoder === 'undefined') {
        return undefined;
    }
    cachedTextDecoder = new TextDecoder('utf8');
    return cachedTextDecoder;
};

const decodeBinaryModule = (
    value: ArrayBuffer | ArrayBufferView
): string | undefined => {
    const decoder = getTextDecoder();
    if (!decoder) {
        return undefined;
    }
    const view =
        value instanceof ArrayBuffer
            ? new Uint8Array(value)
            : new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    return decoder.decode(view);
};

const resolveNestedModule = (
    value: unknown,
    depth = 0,
    visited?: WeakSet<object>
): string | undefined => {
    if (depth > 5) {
        return undefined;
    }
    if (typeof value === 'string' && value.length > 0) {
        return value;
    }
    if (value instanceof ArrayBuffer) {
        return decodeBinaryModule(value);
    }
    if (isArrayBufferView(value)) {
        return decodeBinaryModule(value);
    }
    if (typeof value === 'function') {
        try {
            return resolveNestedModule(value(), depth + 1);
        } catch {
            return undefined;
        }
    }
    if (isRecord(value)) {
        const tracking = visited ?? new WeakSet<object>();
        if (tracking.has(value)) {
            return undefined;
        }
        tracking.add(value);
        const prioritized = WGSL_VALUE_KEYS.map((key) =>
            resolveNestedModule(value[key], depth + 1, tracking)
        ).find((result): result is string => result !== undefined);
        if (prioritized) {
            return prioritized;
        }
        const additionalKeys = Reflect.ownKeys(value)
            .filter((key): key is string => typeof key === 'string')
            .filter(
                (key) =>
                    !WGSL_VALUE_KEYS.includes(
                        key as (typeof WGSL_VALUE_KEYS)[number]
                    )
            )
            .filter((key) => !key.startsWith('_'))
            .filter((key) => key !== 'url');
        return additionalKeys
            .map((key) => resolveNestedModule(value[key], depth + 1, tracking))
            .find((result): result is string => result !== undefined);
    }
    return undefined;
};

export const resolveShaderSource = (module: unknown): string => {
    const resolved = resolveNestedModule(module);
    if (resolved) {
        return resolved;
    }
    if (typeof module === 'object' && module !== null) {
        const defaultSource = (module as { default?: unknown }).default;
        const nested = resolveNestedModule(defaultSource);
        if (nested) {
            return nested;
        }
    }
    const metadata = isRecord(module)
        ? {
              keys: Object.keys(module),
              type: module.constructor?.name ?? typeof module,
          }
        : { type: typeof module };
    console.warn('[ShaderUtils] Unexpected shader module shape', metadata);
    const fallback = String(module);
    console.warn('[ShaderUtils] Falling back to stringified shader module', {
        fallback,
    });
    return fallback;
};
