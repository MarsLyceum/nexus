// src/hooks/useGifPlayer.ts
import { useState, useRef, useEffect, useCallback } from 'react';
import { useGifFrames } from './useGifFrames';

export type UseGifPlayerResult = {
    position: number;
    playing: boolean;
    totalDuration: number;
    togglePlay: () => void;
    onSlidingStart: () => void;
    onValueChange: (val: number) => void;
    onSlidingComplete: (val: number) => void;
};

/** manage play/pause, RAF‐loop, and seek state for a GIF */
export function useGifPlayer(source: string): UseGifPlayerResult {
    const { totalDuration } = useGifFrames(source);
    const [position, setPosition] = useState(0);
    const [playing, setPlaying] = useState(false);
    const lastTsRef = useRef<number>();
    const rafRef = useRef<number>();

    useEffect(() => {
        if (totalDuration > 0) {
            setPlaying(true);
        }
    }, [totalDuration]);

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

    useEffect(() => {
        if (!playing || totalDuration <= 0) return;
        lastTsRef.current = undefined;

        const step = (ts: number) => {
            setPosition(
                (pos) =>
                    (pos + (ts - (lastTsRef.current ?? ts))) % totalDuration
            );
            lastTsRef.current = ts;
            rafRef.current = requestAnimationFrame(step);
        };

        rafRef.current = requestAnimationFrame(step);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [playing, totalDuration]);

    return {
        position,
        playing,
        totalDuration,
        togglePlay,
        onSlidingStart,
        onValueChange,
        onSlidingComplete,
    };
}
