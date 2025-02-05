// BackArrow.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

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
        <Icon name="arrow-left" size={20} color="white" />
    </TouchableOpacity>
);
