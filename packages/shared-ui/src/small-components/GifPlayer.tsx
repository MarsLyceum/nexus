// GifPlayer.tsx
import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { Platform, View } from 'react-native';
import {
    Canvas as SkiaCanvas,
    Image as SkiaImage,
    Skia,
    AlphaType,
    ColorType,
    useClock,
} from '@shopify/react-native-skia';

import { useSharedValue, useDerivedValue } from 'react-native-reanimated';

import { useGifFrames } from '../hooks';

type DOMCanvasCtx = CanvasRenderingContext2D;

export type GifPlayerProps = {
    source: string;
    width: number;
    height: number;
    position: number;
    playing: boolean;
};

export const GifPlayer: React.FC<GifPlayerProps> = ({
    source,
    width,
    height,
    position,
    playing,
}) => {
    const { frames } = useGifFrames(source);

    const canvasRefWeb = useRef<HTMLCanvasElement>(null);

    const positionSV = useSharedValue(position);
    const playingSV = useSharedValue(playing);

    const totalDuration = frames.reduce((sum, f) => sum + f.delay, 0);

    const clock = useClock();

    const delays = useMemo(() => frames.map((f) => f.delay), [frames]);
    // eslint-disable-next-line consistent-return
    const skiaImages = useMemo(() => {
        if (Platform.OS !== 'web') {
            return frames.map((frame) => {
                const {
                    data,
                    width: w,
                    height: h,
                } = frame.imageData as {
                    data: Uint8ClampedArray;
                    width: number;
                    height: number;
                };
                const skData = Skia.Data.fromBytes(new Uint8Array(data.buffer));
                return Skia.Image.MakeImage(
                    {
                        width: w,
                        height: h,
                        alphaType: AlphaType.Premul,
                        colorType: ColorType.RGBA_8888,
                    },
                    skData,
                    w * 4
                );
            });
        }
    }, [frames]);

    useEffect(() => {
        playingSV.value = playing;
    }, [playing]);
    useEffect(() => {
        positionSV.value = position;
    }, [position]);

    const virtualPos = useDerivedValue(() => {
        'worklet';

        return playingSV.value
            ? clock.value % totalDuration
            : Math.min(Math.max(positionSV.value, 0), totalDuration);
    }, [totalDuration]);

    // find current frame index by accumulating delays
    const getFrameIndex = useCallback(() => {
        let acc = 0;
        for (const [i, frame] of frames.entries()) {
            acc += frame.delay;
            if (position < acc) return i;
        }
        return frames.length - 1;
    }, [frames, position]);

    const frameIndex = useDerivedValue(() => {
        'worklet';

        let acc = 0;
        for (const [i, delay] of delays.entries()) {
            acc += delay;
            if (virtualPos.value < acc) {
                return i;
            }
        }
        return delays.length - 1;
    }, [delays, totalDuration]);

    const currentImage = useDerivedValue(
        () => (skiaImages ? skiaImages[frameIndex.value] : undefined),
        [frameIndex, skiaImages]
    );

    // draw the frame
    const draw = useCallback(
        async (ctx: DOMCanvasCtx) => {
            const idx = getFrameIndex();
            const frame = frames[idx];
            const targetW = width;
            const targetH = height;

            // 1) Clear previous frame
            ctx.clearRect(0, 0, width, height);

            // 2) Draw new one
            let imgData: ImageData;
            // eslint-disable-next-line unicorn/prefer-ternary
            if (frame.imageData instanceof ImageData) {
                imgData = frame.imageData;
            } else {
                // frame.imageData.data: Uint8ClampedArray, plus width/height props
                imgData = new ImageData(
                    frame.imageData.data,
                    frame.imageData.width,
                    frame.imageData.height
                );
            }
            if (Platform.OS === 'web') {
                const bitmap = await createImageBitmap(imgData);

                ctx.clearRect(0, 0, targetW, targetH);
                ctx.drawImage(bitmap, 0, 0, targetW, targetH);
            }
        },
        [frames, getFrameIndex, width, height]
    );

    useEffect(() => {
        const canvas = Platform.OS === 'web' ? canvasRefWeb.current : undefined;
        if (!canvas) return;

        if (Platform.OS === 'web') {
            // HTML canvas path
            const html = canvas as HTMLCanvasElement;
            html.width = width;
            html.height = height;
        }
    }, [width, height]);

    // whenever position or frames change, redraw
    useEffect(() => {
        const canvas = Platform.OS === 'web' ? canvasRefWeb.current : undefined;
        if (!canvas || frames.length === 0) return;

        if (Platform.OS === 'web') {
            // HTML canvas path
            const html = canvas as HTMLCanvasElement;
            const ctx = html.getContext('2d');
            if (ctx) {
                void draw(ctx);
            }
        }
    }, [position, frames, draw]);

    return (
        <View>
            <View style={{ width, height }}>
                {Platform.OS === 'web' ? (
                    <canvas
                        ref={canvasRefWeb}
                        width={width}
                        height={height}
                        style={{ width: '100%', height: '100%' }}
                    />
                ) : (
                    skiaImages && (
                        <SkiaCanvas style={{ width, height }} opaque={false}>
                            <SkiaImage
                                image={currentImage}
                                x={0}
                                y={0}
                                width={width}
                                height={height}
                                fit="fill"
                            />
                        </SkiaCanvas>
                    )
                )}
            </View>
        </View>
    );
};
