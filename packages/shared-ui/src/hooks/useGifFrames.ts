// useGifFrames.ts
import { useEffect, useState } from 'react';
import { parseGIF, decompressFrames } from 'gifuct-js';

export type GifFrame = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    imageData:
        | ImageData
        | { data: Uint8ClampedArray; width: number; height: number }; // raw RGBA pixel data
    delay: number; // in ms
};

export type UseGifFramesResult = {
    frames: GifFrame[];
    totalDuration: number;
    error?: Error;
};

type CacheEntry = { frames: GifFrame[]; totalDuration: number };
const gifCache = new Map<string, CacheEntry>();

export function useGifFrames(uri: string): UseGifFramesResult {
    const [frames, setFrames] = useState<GifFrame[]>([]);
    const [totalDuration, setTotalDuration] = useState(0);
    const [error, setError] = useState<Error>();

    useEffect(() => {
        let cancelled = false;

        if (gifCache.has(uri)) {
            const { frames: cachedFrames, totalDuration: cachedDuration } =
                gifCache.get(uri)!;
            setFrames(cachedFrames);
            setTotalDuration(cachedDuration);
            return;
        }

        fetch(uri)
            .then((res) => res.arrayBuffer())
            .then((buffer) => {
                if (cancelled) return;
                const gif = parseGIF(buffer);
                const parsed = decompressFrames(gif, true);
                const out: GifFrame[] = [];
                let sum = 0;
                for (const f of parsed) {
                    const { delay } = f;
                    const { width, height } = f.dims;

                    const imageData = {
                        data: f.patch,
                        width,
                        height,
                    } as ImageData;

                    out.push({ imageData, delay });
                    sum += delay;
                }
                // eslint-disable-next-line promise/always-return
                if (!cancelled) {
                    gifCache.set(uri, { frames: out, totalDuration: sum });
                    setFrames(out);
                    setTotalDuration(sum);
                }
            })
            .catch((error_) => {
                if (!cancelled) setError(error_);
            });
        // eslint-disable-next-line consistent-return
        return () => {
            cancelled = true;
        };
    }, [uri]);

    return { frames, totalDuration, error };
}
