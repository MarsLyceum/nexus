import type { UniformEncoder } from './types';

export const createUniformEncoder = <State>(
    encode: (state: State, target: Float32Array) => void,
    length: number
): UniformEncoder<State> => {
    const scratch = new Float32Array(length);
    return {
        encode: (state) => {
            encode(state, scratch);
            return scratch;
        },
        bufferSize: Float32Array.BYTES_PER_ELEMENT * length,
    };
};

export type CanvasDimensions = {
    readonly width: number;
    readonly height: number;
    readonly dpr: number;
};

export const setCanvasSize = (
    canvas: HTMLCanvasElement,
    dimensions: CanvasDimensions
) => {
    const pixelWidth = Math.max(
        1,
        Math.floor(dimensions.width * dimensions.dpr)
    );
    const pixelHeight = Math.max(
        1,
        Math.floor(dimensions.height * dimensions.dpr)
    );

    if (canvas.width !== pixelWidth) {
        canvas.width = pixelWidth;
    }
    if (canvas.height !== pixelHeight) {
        canvas.height = pixelHeight;
    }

    const styleWidth = `${dimensions.width}px`;
    const styleHeight = `${dimensions.height}px`;

    if (canvas.style.width !== styleWidth) {
        canvas.style.width = styleWidth;
    }
    if (canvas.style.height !== styleHeight) {
        canvas.style.height = styleHeight;
    }
};

export const computeHash = (value: string): string =>
    [...value]
        .reduce((hash, char) => {
            const codePoint = char.codePointAt(0);
            if (codePoint === undefined) {
                return hash;
            }
            return Math.trunc(Math.imul(31, hash) + codePoint);
        }, 0)
        .toString(16);

export const selectFirst = <T>(
    candidates: ReadonlyArray<T | null | undefined>
): T | undefined =>
    candidates.reduce<T | undefined>(
        (found, candidate) =>
            found === undefined && candidate !== undefined && candidate !== null
                ? candidate
                : found,
        undefined
    );
