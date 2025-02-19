import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
}) => (
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

const styles = StyleSheet.create({
    arrowButton: {
        padding: 10,
    },
});
