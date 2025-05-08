// useGifFrames.ts
import { useEffect, useState } from 'react';
import { parseGIF, decompressFrames } from 'gifuct-js';

export type GifFrame = {
    imageData: ImageData; // raw RGBA pixel data
    delay: number; // in ms
};

export type UseGifFramesResult = {
    frames: GifFrame[];
    totalDuration: number;
    error?: Error;
};

export function useGifFrames(uri: string): UseGifFramesResult {
    const [frames, setFrames] = useState<GifFrame[]>([]);
    const [totalDuration, setTotalDuration] = useState(0);
    const [error, setError] = useState<Error>();

    useEffect(() => {
        let cancelled = false;
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
                    setFrames(out);
                    setTotalDuration(sum);
                }
            })
            .catch((error_) => {
                if (!cancelled) setError(error_);
            });
        return () => {
            cancelled = true;
        };
    }, [uri]);

    return { frames, totalDuration, error };
}
