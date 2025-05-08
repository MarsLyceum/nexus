// GifPlayerControls.tsx
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

const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export type GifPlayerControlsProps = {
    playing: boolean;
    position: number;
    totalDuration: number;
    onTogglePlay: () => void;
    onSlidingStart: () => void;
    onValueChange: (val: number) => void;
    onSlidingComplete: (val: number) => void;
};

// eslint-disable-next-line react/display-name
export const GifPlayerControls = forwardRef<
    View,
    GifPlayerControlsProps & ViewProps
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
        }: GifPlayerControlsProps & ViewProps,
        ref
    ) => {
        const { theme } = useTheme();

        return (
            <View
                style={styles.container}
                ref={ref}
                onLayout={viewProps.onLayout}
            >
                <TouchableOpacity
                    onPress={onTogglePlay}
                    style={styles.playButton}
                >
                    <Text style={styles.playIcon}>{playing ? '❚❚' : '▶️'}</Text>
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
                    {formatTime(position)}
                </Text>
            </View>
        );
    }
);

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    playButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 16,
    },
    playIcon: {
        color: 'white',
        fontSize: 16,
    },
    slider: {
        flex: 1,
        marginHorizontal: 8,
    },
    time: {
        fontSize: 14,
    },
});
