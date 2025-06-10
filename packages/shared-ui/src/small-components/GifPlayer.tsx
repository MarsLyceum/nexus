// GifPlayer.tsx
import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { Platform, View } from 'react-native';
import {
    Canvas as SkiaCanvas,
    Image as SkiaImage,
    useClock,
} from '@shopify/react-native-skia';

import { useSharedValue, useDerivedValue } from 'react-native-reanimated';

import { useGifFrames } from '../hooks';

import { NexusImage } from './NexusImage';

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
            return frames.map((f) => f.skImage!);
        }
        return []; // no SkiaImages on web
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
        // eslint-disable-next-line unicorn/no-null
        () => (skiaImages ? skiaImages[frameIndex.value] : null),
        [frameIndex, skiaImages]
    );

    const drawFrame = useCallback(async () => {
        if (Platform.OS === 'web') {
            if (!canvasRefWeb.current || frames.length === 0) return;
            const ctx = canvasRefWeb.current.getContext('2d')!;

            let acc = 0;
            let idx = 0;
            for (const [j, delay] of delays.entries()) {
                acc += delay;
                if (position < acc) {
                    idx = j;
                    break;
                }
            }
            // pick the right frame
            const { imageData } = frames[idx];

            // resize and clear
            canvasRefWeb.current.width = width;
            canvasRefWeb.current.height = height;
            ctx.clearRect(0, 0, width, height);

            if (imageData) {
                const bmp = await createImageBitmap(imageData);

                // draw it scaled to fill the entire canvas area
                ctx.drawImage(bmp, 0, 0, width, height);
            }
        }
    }, [frames, width, height, delays, position]);

    useEffect(() => {
        const canvas = Platform.OS === 'web' ? canvasRefWeb.current : undefined;
        if (!canvas) return;

        if (Platform.OS === 'web') {
            // HTML canvas path
            const html = canvas;
            html.width = width;
            html.height = height;
        }
    }, [width, height]);

    // whenever position or frames change, redraw
    useEffect(() => {
        if (Platform.OS === 'web') {
            if (!canvasRefWeb.current || frames.length === 0) return;
            requestAnimationFrame(drawFrame);
        }
    }, [position, frames, drawFrame]);

    return (
        <View>
            <View style={{ width, height }}>
                {frames.length > 0 ? (
                    Platform.OS === 'web' ? (
                        <canvas
                            ref={canvasRefWeb}
                            width={width}
                            height={height}
                            style={{ width: '100%', height: '100%' }}
                        />
                    ) : (
                        skiaImages && (
                            <SkiaCanvas
                                style={{ width, height }}
                                opaque={false}
                            >
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
                    )
                ) : (
                    <NexusImage
                        source={source}
                        width={width}
                        height={height}
                        alt="Gif"
                    />
                )}
            </View>
        </View>
    );
};
