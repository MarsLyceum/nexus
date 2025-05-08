// GifPlayer.tsx
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    Platform,
    View,
    TouchableOpacity,
    StyleSheet,
    Text,
} from 'react-native';
import RNCanvas, {
    CanvasRenderingContext2D as RNCanvasCtx,
} from 'react-native-canvas';
import Slider from '@react-native-community/slider';
import { useGifFrames } from '../hooks';

type DOMCanvasCtx = CanvasRenderingContext2D;

export type GifPlayerProps = {
    source: string;
    width: number;
    height: number;
};

export const GifPlayer: React.FC<GifPlayerProps> = ({
    source,
    width,
    height,
}) => {
    const { frames, totalDuration } = useGifFrames(source);
    const [position, setPosition] = useState(0); // ms into the loop
    const [playing, setPlaying] = useState(false);

    const canvasRefWeb = useRef<HTMLCanvasElement>(null);
    const canvasRefNative = useRef<RNCanvas>(null);
    const rafRef = useRef<number>();

    // find current frame index by accumulating delays
    const getFrameIndex = useCallback(() => {
        let acc = 0;
        for (const [i, frame] of frames.entries()) {
            acc += frame.delay;
            if (position < acc) return i;
        }
        return frames.length - 1;
    }, [frames, position]);

    // draw the frame
    const draw = useCallback(
        async (ctx: RNCanvasCtx | DOMCanvasCtx) => {
            const idx = getFrameIndex();
            const frame = frames[idx];
            const targetW = width;
            const targetH = height;

            // 1) Clear previous frame
            ctx.clearRect(0, 0, width, height);

            // 2) Draw new one
            if (Platform.OS === 'web') {
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

                const bitmap = await createImageBitmap(imgData);

                ctx.clearRect(0, 0, targetW, targetH);
                // @ts-expect-error bitmap
                ctx.drawImage(bitmap, 0, 0, targetW, targetH);
            } else {
                // react-native-canvas putImageData returns a Promise
                void (ctx as RNCanvasCtx).putImageData(frame.imageData, 0, 0);
            }
        },
        [frames, getFrameIndex, width, height]
    );

    // animation loop
    useEffect(() => {
        const step = (timestamp: number) => {
            setPosition((pos) => {
                const next = playing
                    ? (pos + (timestamp - (rafRef.current || timestamp))) %
                      totalDuration
                    : pos;
                return next;
            });
            rafRef.current = timestamp;
            if (playing) requestAnimationFrame(step);
        };
        if (playing) requestAnimationFrame(step);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [playing, totalDuration]);

    useEffect(() => {
        const canvas =
            Platform.OS === 'web'
                ? canvasRefWeb.current
                : canvasRefNative.current;
        if (!canvas) return;

        if (Platform.OS === 'web') {
            // HTML canvas path
            const html = canvas as HTMLCanvasElement;
            html.width = width;
            html.height = height;
        } else {
            // react-native-canvas path
            const rnCanvas = canvas as RNCanvas;
            rnCanvas.width = width;
            rnCanvas.height = height;
        }
    }, [width, height]);

    // whenever position or frames change, redraw
    useEffect(() => {
        const canvas =
            Platform.OS === 'web'
                ? canvasRefWeb.current
                : canvasRefNative.current;
        if (!canvas || frames.length === 0) return;

        if (Platform.OS === 'web') {
            // HTML canvas path
            const html = canvas as HTMLCanvasElement;
            const ctx = html.getContext('2d');
            if (ctx) draw(ctx);
        } else {
            // react-native-canvas path
            const rnCanvas = canvas as RNCanvas;
            const ctx = rnCanvas.getContext('2d');
            // react-native-canvas putImageData is async under the hood
            void draw(ctx);
        }
    }, [position, frames, draw]);

    return (
        <View style={{ width, height }}>
            {Platform.OS === 'web' ? (
                <canvas
                    ref={canvasRefWeb}
                    width={width}
                    height={height}
                    style={{ width: '100%', height: '100%' }}
                />
            ) : (
                <RNCanvas
                    ref={canvasRefNative}
                    style={{ width: '100%', height: '100%' }}
                />
            )}

            <TouchableOpacity
                onPress={(e) => {
                    e.stopPropagation(); // don’t bubble up to zoom
                    setPlaying((p) => !p);
                }}
                style={{
                    position: 'absolute' as const,
                    bottom: 12,
                    left: 12,
                    width: 32,
                    height: 32,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    borderRadius: 16,
                }}
            >
                <Text style={{ color: 'white', fontSize: 16 }}>
                    {playing ? '❚❚' : '▶️'}
                </Text>
            </TouchableOpacity>

            {/* seek bar */}
            <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={totalDuration}
                value={position}
                onSlidingStart={() => setPlaying(false)}
                onValueChange={(val) => setPosition(val)}
                onSlidingComplete={(val) => {
                    setPosition(val);
                    setPlaying(true);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    slider: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        right: 8,
    },
});
