// BackArrow.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { BackArrowIcon } from '../icons';

type BackArrowProps = {
    onPress: () => void;
    style?: ViewStyle;
};

const styles = StyleSheet.create({
    backButton: {
        marginRight: 10,
    },
});

export const BackArrow: React.FC<BackArrowProps> = ({ onPress, style }) => (
    <TouchableOpacity onPress={onPress} style={[styles.backButton, style]}>
        <BackArrowIcon />
    </TouchableOpacity>
);
