// GifPlayer.tsx
import React, {
    useRef,
    useEffect,
    useCallback,
    useMemo,
    useState,
} from 'react';
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

function findFrameIndex(cumulative: number[], t: number): number {
    let low = 0;
    let high = cumulative.length - 1;
    while (low < high) {
        const mid = Math.floor((low + high) / 2);
        if (t < cumulative[mid]) high = mid;
        else low = mid + 1;
    }
    return low;
}

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

    const [canvasReady, setCanvasReady] = useState(false);

    const totalDuration = frames.reduce((sum, f) => sum + f.delay, 0);

    const clock = useClock();

    const delays = useMemo(() => frames.map((f) => f.delay), [frames]);

    const cumulativeDelays = useMemo<number[]>(() => {
        const out: number[] = [];
        // eslint-disable-next-line unicorn/no-array-reduce
        delays.reduce((sum, d, i) => {
            const next = sum + d;
            out[i] = next;
            return next;
        }, 0);
        return out;
    }, [delays]);

    // eslint-disable-next-line consistent-return
    const skiaImages = useMemo(() => {
        if (Platform.OS !== 'web') {
            return frames.map((f) => f.skImage!);
        }
        return []; // no SkiaImages on web
    }, [frames]);

    const firstFrameDataUrl = useMemo(() => {
        if (frames.length > 0 && frames[0].imageData) {
            const img = frames[0].imageData;
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d')!;
            ctx.putImageData(img, 0, 0);
            return canvas.toDataURL();
        }
        return undefined;
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

            const idx = findFrameIndex(cumulativeDelays, position);

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

            if (!canvasReady) {
                setCanvasReady(true);
            }
        }
    }, [frames, width, height, position, cumulativeDelays, canvasReady]);

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

    useEffect(() => {
        if (Platform.OS !== 'web' && skiaImages.length > 0 && !canvasReady) {
            setCanvasReady(true);
        }
    }, [skiaImages, canvasReady]);

    return (
        <View>
            <View style={{ width, height, position: 'relative' }}>
                {Platform.OS === 'web' ? (
                    <canvas
                        ref={canvasRefWeb}
                        width={width}
                        height={height}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            visibility: canvasReady ? 'visible' : 'hidden',
                            zIndex: 1,
                        }}
                    />
                ) : (
                    skiaImages && (
                        <SkiaCanvas
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                visibility: canvasReady ? 'visible' : 'hidden',
                                zIndex: 1,
                            }}
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
                )}
                {(!frames || frames.length <= 0 || !canvasReady) &&
                    firstFrameDataUrl && (
                        <NexusImage
                            source={firstFrameDataUrl}
                            width={width}
                            height={height}
                            alt="Gif"
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                visibility: canvasReady ? 'hidden' : 'visible',
                                zIndex: 0,
                            }}
                        />
                    )}
            </View>
        </View>
    );
};
