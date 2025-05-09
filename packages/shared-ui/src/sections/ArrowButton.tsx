import React, { useMemo } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme, Theme } from '../theme';

type ArrowButtonProps = {
    direction: 'left' | 'right';
    onPress: () => void;
    disabled: boolean;
    iconSize: number;
    activeColor: string;
    inactiveColor: string;
    style?: ViewStyle;
};

export const ArrowButton: React.FC<ArrowButtonProps> = ({
    direction,
    onPress,
    disabled,
    iconSize,
    activeColor,
    inactiveColor,
    style,
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            style={[styles.arrowButton, style]}
        >
            <MaterialCommunityIcons
                name={direction === 'left' ? 'chevron-left' : 'chevron-right'}
                size={iconSize}
                color={disabled ? inactiveColor : activeColor}
            />
        </TouchableOpacity>
    );
};

function createStyles(theme: Theme) {
    return StyleSheet.create({
        arrowButton: {
            backgroundColor: theme.colors.AppBackground,
            width: 50, // Fixed width for the circle
            height: 50, // Fixed height for the circle
            borderRadius: 25, // Half of width/height to ensure a circle
            alignItems: 'center', // Center the icon horizontally
            justifyContent: 'center', // Center the icon vertically
        },
    });
}
