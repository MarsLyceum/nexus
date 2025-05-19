// MediaPlayerControls.tsx
import React, { forwardRef, useState, useMemo, useRef, useEffect } from 'react';
import {
    View,
    TouchableOpacity,
    Text,
    StyleSheet,
    ViewProps,
    useWindowDimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import {
    Gesture,
    GestureDetector,
    NativeGesture,
} from 'react-native-gesture-handler';
import { useTheme, Theme } from '../theme';
import { Play, Pause, Volume, VolumeMuted } from '../icons';

const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export type MediaPlayerControlsProps = {
    playing: boolean;
    volumeMuted?: boolean;
    volumeLevel?: number;
    position: number;
    totalDuration: number;
    onTogglePlay: () => void;
    onToggleVolumeMuted?: () => void;
    onSlidingStart: () => void;
    onValueChange: (val: number) => void;
    onSlidingComplete: (val: number) => void;
    onVolumeChange?: (v: number) => void;
    sliderGesture?: NativeGesture;
};

// eslint-disable-next-line react/display-name
export const MediaPlayerControls = forwardRef<
    View,
    MediaPlayerControlsProps & ViewProps
>(
    (
        {
            playing,
            volumeMuted,
            volumeLevel,
            position,
            totalDuration,
            onTogglePlay,
            onToggleVolumeMuted,
            onVolumeChange,
            onSlidingStart,
            onValueChange,
            onSlidingComplete,
            sliderGesture,
            ...viewProps
        }: MediaPlayerControlsProps & ViewProps,
        ref
    ) => {
        const { theme } = useTheme();
        const [showVolumeSlider, setShowVolumeSlider] = useState(false);
        const styles = useMemo(() => createStyles(theme), [theme]);
        const { width: screenWidth } = useWindowDimensions();
        const isSmallScreen = screenWidth < 768;

        const SLIDER_HEIGHT = 120;
        const volDragging = useRef(false);
        const startY = useRef(0);
        const startVol = useRef(volumeLevel);

        useEffect(() => {
            if (!volumeMuted && volumeLevel === 0 && onToggleVolumeMuted) {
                onToggleVolumeMuted();
            }
            if (
                volumeMuted &&
                volumeLevel &&
                volumeLevel > 0 &&
                onToggleVolumeMuted
            ) {
                onToggleVolumeMuted();
            }
        }, [volumeLevel, onToggleVolumeMuted, volumeMuted]);

        return (
            <View
                style={styles.container}
                ref={ref}
                onLayout={viewProps.onLayout}
            >
                <TouchableOpacity onPress={onTogglePlay}>
                    {playing ? <Pause /> : <Play />}
                </TouchableOpacity>
                {sliderGesture ? (
                    <GestureDetector gesture={sliderGesture}>
                        <View
                            collapsable={false}
                            style={styles.sliderContainer}
                        >
                            <Slider
                                style={styles.slider}
                                minimumValue={0}
                                maximumValue={totalDuration}
                                value={position}
                                onSlidingStart={onSlidingStart}
                                onValueChange={onValueChange}
                                onSlidingComplete={onSlidingComplete}
                                minimumTrackTintColor={theme.colors.ActiveText}
                                thumbTintColor={theme.colors.ActiveText}
                                collapsable={false}
                            />
                        </View>
                    </GestureDetector>
                ) : (
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={totalDuration}
                        value={position}
                        onSlidingStart={onSlidingStart}
                        onValueChange={onValueChange}
                        onSlidingComplete={onSlidingComplete}
                        minimumTrackTintColor={theme.colors.ActiveText}
                        thumbTintColor={theme.colors.ActiveText}
                        collapsable={false}
                    />
                )}

                <Text style={[styles.time, { color: theme.colors.ActiveText }]}>
                    {isSmallScreen
                        ? formatTime(position)
                        : `${formatTime(position)} / ${formatTime(totalDuration)}`}
                </Text>
                <View
                    // on web: open on hover
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                    style={styles.volumeWrapper}
                >
                    <TouchableOpacity onPress={onToggleVolumeMuted}>
                        {volumeMuted ? <VolumeMuted /> : <Volume />}
                    </TouchableOpacity>

                    {showVolumeSlider && (
                        <View
                            style={styles.volumeSliderContainer}
                            // start drag
                            onMouseDown={(e: any) => {
                                // begin drag
                                volDragging.current = true;
                                startY.current = e.clientY;
                                startVol.current = volumeLevel ?? 0;
                                onSlidingStart();

                                // document‑level move & up
                                const onDocMouseMove = (ev: MouseEvent) => {
                                    if (!volDragging.current) return;
                                    const dy = startY.current - ev.clientY;
                                    const r =
                                        startVol.current + dy / SLIDER_HEIGHT;
                                    onVolumeChange?.(
                                        Math.max(0, Math.min(1, r))
                                    );
                                };
                                const onDocMouseUp = (ev: MouseEvent) => {
                                    if (!volDragging.current) return;
                                    volDragging.current = false;
                                    document.removeEventListener(
                                        'mousemove',
                                        onDocMouseMove
                                    );
                                    document.removeEventListener(
                                        'mouseup',
                                        onDocMouseUp
                                    );
                                    const dy = startY.current - ev.clientY;
                                    const r =
                                        startVol.current + dy / SLIDER_HEIGHT;
                                    onSlidingComplete(
                                        Math.max(0, Math.min(1, r))
                                    );
                                };
                                document.addEventListener(
                                    'mousemove',
                                    onDocMouseMove
                                );
                                document.addEventListener(
                                    'mouseup',
                                    onDocMouseUp
                                );
                            }}
                            // during drag
                            onMouseMove={(e: any) => {
                                if (!volDragging.current) return;
                                const dy = startY.current - e.clientY;
                                const ratio = Math.max(
                                    0,
                                    Math.min(
                                        1,
                                        startVol.current + dy / SLIDER_HEIGHT
                                    )
                                );
                                onVolumeChange?.(ratio);
                            }}
                            // end drag
                            onMouseUp={(e: any) => {
                                if (!volDragging.current) return;
                                volDragging.current = false;
                                const dy = startY.current - e.clientY;
                                const ratio = Math.max(
                                    0,
                                    Math.min(
                                        1,
                                        startVol.current + dy / SLIDER_HEIGHT
                                    )
                                );
                                onSlidingComplete(ratio);
                            }}
                        >
                            <View style={styles.volumeSliderWrapper}>
                                <Slider
                                    style={styles.volumeSlider}
                                    minimumValue={0}
                                    maximumValue={1}
                                    step={0.01}
                                    value={volumeLevel}
                                    onValueChange={onVolumeChange}
                                    minimumTrackTintColor={
                                        theme.colors.ActiveText
                                    }
                                    thumbTintColor={theme.colors.ActiveText}
                                    pointerEvents="none"
                                />
                            </View>
                        </View>
                    )}
                </View>
            </View>
        );
    }
);

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            // marginBottom: 40,
            // marginTop: 8,
            width: '100%',
            height: 40,
        },
        slider: {
            flex: 1,
        },
        sliderContainer: {
            flex: 1,
            marginHorizontal: 8,
        },
        time: {
            fontSize: 14,
            marginRight: 8,
        },
        volumeWrapper: {
            position: 'relative',
            marginLeft: 8,
            width: 40, // same as your volumeSliderContainer width
            height: 120 + 32, // slider height (120) + bottom offset (32)
            justifyContent: 'flex-end', // push the icon down to where it was
            alignItems: 'center',
            overflow: 'visible', // still allow the slider to overflow up
        },
        volumeSliderContainer: {
            position: 'absolute',
            bottom: 32, // lifts it above the icon
            left: '50%', // center‑over icon
            transform: [{ translateX: -20 }],
            width: 40,
            height: 120,
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: 4,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 8,
        },
        volumeSlider: {
            width: 100, // slider length
            height: 30, // slider thickness
        },
        volumeSliderWrapper: {
            width: 120, // slider length
            height: 30, // slider thickness
            transform: [{ rotate: '-90deg' }],
            // ensure rotation origin is the center
            transformOrigin: 'center center',
        },
    });
}
