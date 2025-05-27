// useGifFrames.ts
import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { parseGIF, decompressFrames } from 'gifuct-js';

import {
    Skia,
    AlphaType,
    ColorType,
    ClipOp,
    SkImage,
} from '@shopify/react-native-skia';
import { runOnUI, runOnJS } from 'react-native-reanimated';

export type GifFrame = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    imageData?: ImageData;
    skImage?: SkImage;
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

    const updateValues = useCallback(
        (key: string, frames_: GifFrame[], tot: number) => {
            gifCache.set(key, { frames: frames_, totalDuration: tot });
            setFrames(frames_);
            setTotalDuration(tot);
        },
        []
    );

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
                .then(async (buffer) => {
                    if (cancelled) return;

                    const gif = parseGIF(buffer);

                    // pull screen dims & global background color
                    const {
                        width: W,
                        height: H,
                        backgroundColorIndex: bgIdx,
                    } = gif.lsd;
                    const [bgR, bgG, bgB] = gif.gct[bgIdx];

                    // decode patches
                    const parsed = decompressFrames(
                        gif,
                        /* buildPatch= */ true
                    );

                    // container for results
                    const out: GifFrame[] = [];
                    let sum = 0;

                    if (Platform.OS === 'web') {
                        // —–– WEB PATH: OffscreenCanvas compositing + getImageData
                        const off =
                            typeof OffscreenCanvas !== 'undefined'
                                ? new OffscreenCanvas(W, H)
                                : document.createElement('canvas');
                        off.width = W;
                        off.height = H;
                        const ctx = off.getContext('2d')!;

                        // fill BG once
                        if (ctx.fillStyle) {
                            ctx.fillStyle = `rgb(${bgR},${bgG},${bgB})`;
                        }
                        ctx.fillRect(0, 0, W, H);

                        for (const f of parsed) {
                            const { dims, disposalType, patch, delay } = f;

                            if (disposalType === 2) {
                                // restore that rect to BG
                                ctx.fillStyle = `rgb(${bgR},${bgG},${bgB})`;
                                ctx.fillRect(
                                    dims.left,
                                    dims.top,
                                    dims.width,
                                    dims.height
                                );
                            }

                            // draw this patch with alpha-blending
                            const imgData = new ImageData(
                                new Uint8ClampedArray(patch.buffer),
                                dims.width,
                                dims.height
                            );
                            // eslint-disable-next-line no-await-in-loop
                            const bitmap = await createImageBitmap(imgData);
                            ctx.drawImage(bitmap, dims.left, dims.top);

                            // snapshot full frame
                            const full = ctx.getImageData(0, 0, W, H);
                            out.push({ imageData: full, delay });
                            sum += delay;
                        }
                    } else {
                        runOnUI(
                            (
                                parsedFrames: {
                                    dims: {
                                        left: number;
                                        top: number;
                                        width: number;
                                        height: number;
                                    };
                                    disposalType: number;
                                    patch: Uint8ClampedArray;
                                    delay: number;
                                }[],
                                w: number,
                                h: number,
                                bgColor: string
                            ) => {
                                'worklet';

                                const surf = Skia.Surface.MakeOffscreen(w, h);
                                if (!surf) {
                                    return;
                                }
                                const c = surf.getCanvas();
                                c.drawColor(Skia.Color(bgColor));

                                const outNative: GifFrame[] = [];
                                for (const f of parsedFrames) {
                                    const { dims, disposalType, patch, delay } =
                                        f;

                                    if (disposalType === 2) {
                                        c.save();
                                        c.clipRect(
                                            Skia.XYWHRect(
                                                dims.left,
                                                dims.top,
                                                dims.width,
                                                dims.height
                                            ),
                                            ClipOp.Intersect,
                                            false
                                        );
                                        c.drawColor(Skia.Color(bgColor));
                                        c.restore();
                                    }

                                    // reinterpret the Uint8ClampedArray as a Uint8Array view
                                    const bytes = new Uint8Array(
                                        patch.buffer,
                                        patch.byteOffset,
                                        patch.byteLength
                                    );
                                    const skData = Skia.Data.fromBytes(bytes);
                                    const img = Skia.Image.MakeImage(
                                        {
                                            width: dims.width,
                                            height: dims.height,
                                            alphaType: AlphaType.Unpremul,
                                            colorType: ColorType.RGBA_8888,
                                        },
                                        skData,
                                        dims.width * 4
                                    )!;
                                    c.drawImage(img, dims.left, dims.top);

                                    surf.flush();
                                    const snap = surf.makeImageSnapshot();
                                    outNative.push({ skImage: snap, delay });
                                    sum += delay;
                                }

                                runOnJS(updateValues)(uri, outNative, sum);
                            }
                        )(
                            parsed.map((f) => ({
                                dims: f.dims,
                                disposalType: f.disposalType,
                                patch: f.patch,
                                delay: f.delay,
                            })),
                            W,
                            H,
                            `rgb(${bgR},${bgG},${bgB})`
                        );
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
    }, [uri, updateValues]);

    return { frames, totalDuration, error };
}
