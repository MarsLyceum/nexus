// useGifFrames.ts
import { useEffect, useState } from 'react';
import { parseGIF, decompressFrames } from 'gifuct-js';

export type GifFrame = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    imageData: ImageData;
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

        setTimeout(() => {
            fetch(uri)
                .then((res) => res.arrayBuffer())
                .then((buffer) => {
                    if (cancelled) return;

                    const gif = parseGIF(buffer);
                    alert('gif:' + gif);
                    const {
                        width: W,
                        height: H,
                        backgroundColorIndex: bgIdx,
                    } = gif.lsd;
                    alert('bgIdx:' + bgIdx);
                    const [bgR, bgG, bgB] = gif.gct[bgIdx];

                    // 2) Decode into RGBA “patches”
                    const parsed = decompressFrames(
                        gif,
                        /* buildPatch= */ true
                    );
                    alert('parsed:' + parsed);

                    // 3) Create a running full‐canvas RGBA buffer
                    const full = new Uint8ClampedArray(W * H * 4);
                    for (let i = 0; i < full.length; i += 4) {
                        full[i] = bgR;
                        full[i + 1] = bgG;
                        full[i + 2] = bgB;
                        full[i + 3] = 255;
                    }
                    alert('created the full canvas buffer');

                    // 4) Composite each frame with correct disposal + alpha blending
                    const out: GifFrame[] = [];
                    let sum = 0;

                    for (const f of parsed) {
                        const { dims, disposalType, patch, delay } = f;

                        // disposal=2 → restore that rectangle back to the background color
                        if (disposalType === 2) {
                            for (let y = 0; y < dims.height; y++) {
                                const rowBase =
                                    ((dims.top + y) * W + dims.left) * 4;
                                for (let x = 0; x < dims.width; x++) {
                                    const idx = rowBase + x * 4;
                                    full[idx] = bgR;
                                    full[idx + 1] = bgG;
                                    full[idx + 2] = bgB;
                                    full[idx + 3] = 255;
                                }
                            }
                        }

                        // Alpha‐blend this patch onto the full buffer
                        for (let y = 0; y < dims.height; y++) {
                            for (let x = 0; x < dims.width; x++) {
                                const srcBase = (y * dims.width + x) * 4;
                                const dstBase =
                                    ((dims.top + y) * W + (dims.left + x)) * 4;

                                const rS = patch[srcBase];
                                const gS = patch[srcBase + 1];
                                const bS = patch[srcBase + 2];
                                const aS = patch[srcBase + 3] / 255;

                                full[dstBase] =
                                    rS * aS + full[dstBase] * (1 - aS);
                                full[dstBase + 1] =
                                    gS * aS + full[dstBase + 1] * (1 - aS);
                                full[dstBase + 2] =
                                    bS * aS + full[dstBase + 2] * (1 - aS);
                                full[dstBase + 3] = 255;
                            }
                        }
                        alert('alpha blended this patch');

                        // 5) Snapshot this frame into a fresh ImageData
                        const snapshot = new Uint8ClampedArray(full);
                        alert('snapshot:' + snapshot);
                        const imageData = new ImageData(snapshot, W, H);
                        alert('imageData' + imageData);
                        out.push({
                            imageData,
                            delay,
                        });
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
        }, 0);
        // eslint-disable-next-line consistent-return
        return () => {
            cancelled = true;
        };
    }, [uri]);

    return { frames, totalDuration, error };
}
