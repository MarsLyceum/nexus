// MediaPlayerControls.tsx
import React, { forwardRef, useState, useMemo, useRef, useEffect } from 'react';
import {
    View,
    TouchableOpacity,
    Text,
    StyleSheet,
    ViewProps,
    useWindowDimensions,
    Pressable,
    Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import Animated, {
    useAnimatedProps,
    SharedValue,
} from 'react-native-reanimated';
import { GestureDetector, NativeGesture } from 'react-native-gesture-handler';

import { useSystemBars } from '../hooks';
import { useTheme, Theme } from '../theme';
import { Play, Pause, Volume, VolumeMuted, FullScreen } from '../icons';

const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const AnimatedSlider = Animated.createAnimatedComponent(Slider);

// eslint-disable-next-line react/display-name
const MemoSlider = React.memo((props: React.ComponentProps<typeof Slider>) => (
    <Slider {...props} />
));

const SeekBarSlider = Platform.OS === 'web' ? MemoSlider : AnimatedSlider;

export type MediaPlayerControlsProps = {
    playing: boolean;
    volumeMuted?: boolean;
    isGif?: boolean;
    volumeLevel?: number;
    position: number;
    virtualPos?: SharedValue<number>;
    totalDuration: number;
    onTogglePlay: () => void;
    onToggleVolumeMuted?: () => void;
    onSlidingStart: () => void;
    onValueChange: (val: number) => void;
    onSlidingComplete: (val: number) => void;
    onVolumeChange?: (v: number) => void;
    onToggleFullScreen?: () => void;
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
            virtualPos,
            totalDuration,
            isGif,
            onTogglePlay,
            onToggleVolumeMuted,
            onVolumeChange,
            onSlidingStart,
            onValueChange,
            onSlidingComplete,
            onToggleFullScreen,
            sliderGesture,
            ...viewProps
        }: MediaPlayerControlsProps & ViewProps,
        ref
    ) => {
        const { theme } = useTheme();
        const { statusBarHeight, navBarHeight } = useSystemBars();
        const { width: screenWidth, height: screenHeight } =
            useWindowDimensions();
        const isLandscape = useMemo(
            () => screenWidth > screenHeight,
            [screenWidth, screenHeight]
        );
        const [showVolumeSlider, setShowVolumeSlider] = useState(false);
        const styles = useMemo(
            () =>
                createStyles(theme, isLandscape, statusBarHeight, navBarHeight),
            [theme, isLandscape, statusBarHeight, navBarHeight]
        );

        const isSmallScreen = screenWidth < 768;

        const sliderAnimatedProps = useAnimatedProps(
            () => ({
                value: virtualPos ? virtualPos.value : position,
            }),
            [virtualPos, position]
        );

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
        }, [volumeLevel]);

        return (
            <View style={styles.outerContainer}>
                <View
                    style={styles.container}
                    ref={ref}
                    onLayout={viewProps.onLayout}
                >
                    <TouchableOpacity onPress={onTogglePlay}>
                        {playing ? <Pause /> : <Play />}
                    </TouchableOpacity>
                    <View style={styles.sliderOuterContainer}>
                        {sliderGesture ? (
                            <GestureDetector gesture={sliderGesture}>
                                <View
                                    collapsable={false}
                                    style={styles.sliderContainer}
                                >
                                    <SeekBarSlider
                                        step={1}
                                        style={styles.slider}
                                        minimumValue={0}
                                        maximumValue={totalDuration}
                                        {...(Platform.OS === 'web'
                                            ? { value: position }
                                            : {
                                                  animatedProps:
                                                      sliderAnimatedProps,
                                              })}
                                        value={position}
                                        onSlidingStart={onSlidingStart}
                                        onValueChange={onValueChange}
                                        onSlidingComplete={onSlidingComplete}
                                        minimumTrackTintColor={
                                            theme.colors.ActiveText
                                        }
                                        thumbTintColor={theme.colors.ActiveText}
                                        collapsable={false}
                                    />
                                </View>
                            </GestureDetector>
                        ) : (
                            <SeekBarSlider
                                step={1}
                                style={styles.slider}
                                minimumValue={0}
                                maximumValue={totalDuration}
                                {...(Platform.OS === 'web'
                                    ? { value: position }
                                    : { animatedProps: sliderAnimatedProps })}
                                onSlidingStart={onSlidingStart}
                                onValueChange={onValueChange}
                                onSlidingComplete={onSlidingComplete}
                                minimumTrackTintColor={theme.colors.ActiveText}
                                thumbTintColor={theme.colors.ActiveText}
                                collapsable={false}
                            />
                        )}
                    </View>

                    <Text
                        style={[
                            styles.time,
                            { color: theme.colors.ActiveText },
                        ]}
                    >
                        {isSmallScreen
                            ? formatTime(position)
                            : `${formatTime(position)} / ${formatTime(totalDuration)}`}
                    </Text>

                    {isGif ? (
                        <Text style={styles.gifButtonText}>GIF</Text>
                    ) : (
                        <View
                            // on web: open on hover
                            onMouseLeave={() => setShowVolumeSlider(false)}
                            style={styles.volumeWrapper}
                        >
                            <Pressable
                                onMouseEnter={() => setShowVolumeSlider(true)}
                                onPress={onToggleVolumeMuted}
                            >
                                {volumeMuted ? <VolumeMuted /> : <Volume />}
                            </Pressable>

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
                                        const onDocMouseMove = (
                                            ev: MouseEvent
                                        ) => {
                                            if (!volDragging.current) return;
                                            const dy =
                                                startY.current - ev.clientY;
                                            const r =
                                                startVol.current +
                                                dy / SLIDER_HEIGHT;
                                            onVolumeChange?.(
                                                Math.max(0, Math.min(1, r))
                                            );
                                        };
                                        const onDocMouseUp = (
                                            ev: MouseEvent
                                        ) => {
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
                                            const dy =
                                                startY.current - ev.clientY;
                                            const r =
                                                startVol.current +
                                                dy / SLIDER_HEIGHT;
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
                                                startVol.current +
                                                    dy / SLIDER_HEIGHT
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
                                                startVol.current +
                                                    dy / SLIDER_HEIGHT
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
                                            thumbTintColor={
                                                theme.colors.ActiveText
                                            }
                                            pointerEvents="none"
                                        />
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {!isGif ? (
                        <Pressable
                            onPress={onToggleFullScreen}
                            style={styles.fullScreen}
                        >
                            <FullScreen />
                        </Pressable>
                    ) : undefined}
                </View>
            </View>
        );
    }
);

function createStyles(
    theme: Theme,
    isLandscape: boolean,
    statusBarHeight: number,
    navBarHeight: number
) {
    return StyleSheet.create({
        fullScreen: {
            marginLeft: 4,
        },
        gifButtonText: {
            color: theme.colors.ActiveText,
            fontSize: 16,
            fontWeight: 'bold',
            fontFamily: 'Roboto_700Bold',
        },
        outerContainer: {
            width: '100%',
        },
        container: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            // width: isLandscape && Platform.OS !== 'web' ? '100%' : '100%',
            alignSelf: 'stretch',
            overflow: 'hidden',
            height: 20,
            paddingLeft: 10,
            paddingRight: 10,
            marginLeft:
                isLandscape && Platform.OS !== 'web' ? statusBarHeight : 0,
            marginRight:
                isLandscape && Platform.OS !== 'web' ? navBarHeight : 0,
        },
        slider: {
            flex: 1,
            minWidth: 0,
        },
        sliderOuterContainer: {
            marginHorizontal: 8,
            flex: 1,
        },
        sliderContainer: {
            flex: 1,
        },
        time: {
            fontSize: 14,
            marginRight: 4,
            flexShrink: 1,
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
