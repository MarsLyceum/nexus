import React from 'react';
import {
    Pressable,
    PressableProps,
    StyleSheet,
    ViewStyle,
    Platform,
    View,
} from 'react-native';
import styled from 'styled-components/native';
import { COLORS } from '../constants';

const ButtonText = styled.Text`
    color: ${COLORS.White};
    font-size: 16px;
    font-weight: bold;
`;

interface PrimaryGradientButtonProps extends PressableProps {
    title: string;
    style?: ViewStyle | ViewStyle[];
}

const styles = StyleSheet.create({
    shadowContainer: {
        borderRadius: 25,
        width: 280,
        marginLeft: 3, // Adding margin to prevent cutting off
        overflow: Platform.OS === 'web' ? 'visible' : 'hidden',
        ...Platform.select({
            web: {
                shadowColor: 'rgba(0,0,0,0.25)',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 1,
                shadowRadius: 5,
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
            },
        }),
    },
    button: {
        width: 280,
        height: 50,
        backgroundColor: COLORS.Primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 25,
    },
});

export const PrimaryGradientButton: React.FC<PrimaryGradientButtonProps> = ({
    onPress,
    title,
    style,
    ...rest
}) => (
    <View style={[styles.shadowContainer, style]}>
        <Pressable onPress={onPress} style={styles.button} {...rest}>
            <ButtonText>{title}</ButtonText>
        </Pressable>
    </View>
);
