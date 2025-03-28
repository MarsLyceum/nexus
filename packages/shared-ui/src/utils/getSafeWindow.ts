export function getSafeWindow(): Window | undefined {
    if (
        typeof globalThis !== 'undefined' &&
        // eslint-disable-next-line unicorn/no-typeof-undefined
        typeof globalThis.window !== 'undefined'
    ) {
        return globalThis.window;
    }
    return undefined;
}
