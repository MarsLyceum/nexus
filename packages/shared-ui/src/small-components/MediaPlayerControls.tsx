// MediaPlayerControls.tsx
import React, { forwardRef } from 'react';
import {
    View,
    TouchableOpacity,
    Text,
    StyleSheet,
    ViewProps,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useTheme } from '../theme';
import { Play, Pause } from '../icons';

const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export type MediaPlayerControlsProps = {
    playing: boolean;
    position: number;
    totalDuration: number;
    onTogglePlay: () => void;
    onSlidingStart: () => void;
    onValueChange: (val: number) => void;
    onSlidingComplete: (val: number) => void;
};

// eslint-disable-next-line react/display-name
export const MediaPlayerControls = forwardRef<
    View,
    MediaPlayerControlsProps & ViewProps
>(
    (
        {
            playing,
            position,
            totalDuration,
            onTogglePlay,
            onSlidingStart,
            onValueChange,
            onSlidingComplete,
            ...viewProps
        }: MediaPlayerControlsProps & ViewProps,
        ref
    ) => {
        const { theme } = useTheme();

        return (
            <View
                style={styles.container}
                ref={ref}
                onLayout={viewProps.onLayout}
            >
                <TouchableOpacity onPress={onTogglePlay}>
                    {playing ? <Pause /> : <Play />}
                </TouchableOpacity>

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
                />

                <Text style={[styles.time, { color: theme.colors.ActiveText }]}>
                    {formatTime(position)} / {formatTime(totalDuration)}
                </Text>
            </View>
        );
    }
);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        width: '100%',
    },
    slider: {
        flex: 1,
        marginHorizontal: 8,
    },
    time: {
        fontSize: 14,
    },
});
