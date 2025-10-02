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
import { toRgba } from '../utils';
import { useTheme, Theme } from '../theme';
import { Play, Pause, Volume, VolumeMuted, FullScreen } from '../icons';
import { Spacing, BorderRadius, Typography } from '../constants/designSystem';

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

const SLIDER_HEIGHT = 120;

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

        const VOLUME_MIN = 0;
        const VOLUME_MAX = 1;

        const volDragging = useRef(false);
        const startY = useRef(0);
        const startVol = useRef(volumeLevel ?? 0);

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
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                                            const nextVolume = Math.max(
                                                VOLUME_MIN,
                                                Math.min(VOLUME_MAX, r)
                                            );
                                            onVolumeChange?.(nextVolume);
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
                                            const nextVolume = Math.max(
                                                VOLUME_MIN,
                                                Math.min(VOLUME_MAX, r)
                                            );
                                            onSlidingComplete(nextVolume);
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
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    onMouseMove={(e: any) => {
                                        if (!volDragging.current) return;
                                        const dy = startY.current - e.clientY;
                                        const ratio = Math.max(
                                            VOLUME_MIN,
                                            Math.min(
                                                VOLUME_MAX,
                                                startVol.current +
                                                    dy / SLIDER_HEIGHT
                                            )
                                        );
                                        onVolumeChange?.(ratio);
                                    }}
                                    // end drag
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    onMouseUp={(e: any) => {
                                        if (!volDragging.current) return;
                                        volDragging.current = false;
                                        const dy = startY.current - e.clientY;
                                        const ratio = Math.max(
                                            VOLUME_MIN,
                                            Math.min(
                                                VOLUME_MAX,
                                                startVol.current +
                                                    dy / SLIDER_HEIGHT
                                            )
                                        );
                                        onSlidingComplete(ratio);
                                    }}
                                >
                                    <View style={styles.volumeSliderWrapper}>
                                        <Slider
                                            style={StyleSheet.flatten([
                                                styles.volumeSlider,
                                                Platform.OS === 'web'
                                                    ? { pointerEvents: 'none' }
                                                    : undefined,
                                            ])}
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
                                            pointerEvents={
                                                Platform.OS === 'web'
                                                    ? undefined
                                                    : 'none'
                                            }
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
            marginLeft: Spacing.SM,
        },
        gifButtonText: {
            color: theme.colors.ActiveText,
            ...Typography.Body,
            fontFamily: theme.fonts.primary?.bold,
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
            height: Spacing.LG + Spacing.SM,
            paddingLeft: Spacing.SM,
            paddingRight: Spacing.SM,
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
            marginHorizontal: Spacing.SM,
            flex: 1,
        },
        sliderContainer: {
            flex: 1,
        },
        time: {
            ...Typography.Caption,
            fontFamily: theme.fonts.secondary?.regular,
            marginRight: Spacing.XS,
            flexShrink: 1,
        },
        volumeWrapper: {
            position: 'relative',
            marginLeft: Spacing.SM,
            width: Spacing.XXXL + Spacing.SM, // same as volumeSliderContainer width
            height: SLIDER_HEIGHT + Spacing.XXL, // slider height + bottom offset
            justifyContent: 'flex-end', // push the icon down to where it was
            alignItems: 'center',
            overflow: 'visible', // still allow the slider to overflow up
        },
        volumeSliderContainer: {
            position: 'absolute',
            bottom: Spacing.XXL, // lifts it above the icon
            left: '50%', // center‑over icon
            transform: [{ translateX: -(Spacing.XXXL + Spacing.SM) / 2 }],
            width: Spacing.XXXL + Spacing.SM,
            height: SLIDER_HEIGHT,
            backgroundColor: toRgba(theme.colors.AppBackground, 0.9),
            borderRadius: BorderRadius.ExtraSmall,
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, 0.05),
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: Spacing.SM,
        },
        volumeSlider: {
            width: Spacing.XXXL * 3, // slider length
            height: Spacing.LG, // slider thickness
        },
        volumeSliderWrapper: {
            width: Spacing.XXXL * 3 + Spacing.SM,
            height: Spacing.LG,
            transform: [{ rotate: '-90deg' }],
            // ensure rotation origin is the center
            transformOrigin: 'center center',
        },
    });
}
