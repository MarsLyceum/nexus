// src/hooks/useGifPlayer.ts

import { useState, useRef, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

// Skia & Reanimated imports for native playback
import { useClock } from '@shopify/react-native-skia';
import {
    useSharedValue,
    useDerivedValue,
    useAnimatedReaction,
    runOnJS,
    SharedValue,
} from 'react-native-reanimated';

import { useGifFrames } from './useGifFrames';

export type UseGifPlayerResult = {
    position: number;
    virtualPos: SharedValue<number>;
    playing: boolean;
    totalDuration: number;
    togglePlay: () => void;
    onSlidingStart: () => void;
    onValueChange: (val: number) => void;
    onSlidingComplete: (val: number) => void;
};

/**
 * Manages play/pause, seek, and timing for a GIF.
 *
 * - On web, uses requestAnimationFrame loop.
 * - On native, uses Skia's useClock() (UI thread) + Reanimated worklets to drive position,
 *   then mirrors that back into React state so your slider stays in sync.
 */
export function useGifPlayer(source: string): UseGifPlayerResult {
    const { totalDuration } = useGifFrames(source);

    const [position, setPosition] = useState(0);
    const [playing, setPlaying] = useState(false);

    // Refs for web fallback
    const lastTsRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);

    // Skia clock & shared values for native
    const clock = useClock(); // returns ms since activated
    const playingSV = useSharedValue(false);
    const seekSV = useSharedValue(0);

    // Web: start playing as soon as we know the duration
    useEffect(() => {
        if (totalDuration > 0) {
            setPlaying(true);
        }
    }, [totalDuration]);

    // Handlers exposed to the UI
    const togglePlay = useCallback(() => {
        setPlaying((p) => !p);
    }, []);
    const onSlidingStart = useCallback(() => {
        setPlaying(false);
    }, []);
    const onValueChange = useCallback((val: number) => {
        setPosition(val);
    }, []);
    const onSlidingComplete = useCallback((val: number) => {
        setPosition(val);
    }, []);

    // ==== WEB PLAYBACK (fallback) ====
    useEffect(() => {
        if (Platform.OS === 'web') {
            if (!playing || totalDuration <= 0) return;
            // eslint-disable-next-line unicorn/no-null
            lastTsRef.current = null;

            const step = (ts: number) => {
                setPosition((pos) => {
                    const next =
                        (pos + (ts - (lastTsRef.current ?? ts))) %
                        totalDuration;
                    return Math.floor(next);
                });
                lastTsRef.current = ts;
                rafRef.current = requestAnimationFrame(step);
            };

            rafRef.current = requestAnimationFrame(step);
            // eslint-disable-next-line consistent-return
            return () => {
                if (rafRef.current) cancelAnimationFrame(rafRef.current);
            };
        }
    }, [playing, totalDuration]);

    // ==== NATIVE PLAYBACK (Skia + Reanimated) ====
    // Mirror React state → shared values
    useEffect(() => {
        playingSV.value = playing;
    }, [playing, playingSV]);
    useEffect(() => {
        seekSV.value = position;
    }, [position, seekSV]);

    // Compute the “virtual” playback position on the UI thread:
    //  • if playing, use clock % totalDuration (loops smoothly)
    //  • if paused/seeking, use the last seekSV value
    const virtualPos = useDerivedValue(() => {
        'worklet';

        return playingSV.value
            ? clock.value % totalDuration
            : Math.min(Math.max(seekSV.value, 0), totalDuration);
    }, [totalDuration]);

    useAnimatedReaction(
        () => virtualPos.value,
        (value) => {
            'worklet';

            if (Platform.OS !== 'web') {
                runOnJS(setPosition)(Math.floor(value));
            }
        },
        [virtualPos]
    );

    return {
        position,
        virtualPos,
        playing,
        totalDuration,
        togglePlay,
        onSlidingStart,
        onValueChange,
        onSlidingComplete,
    };
}
