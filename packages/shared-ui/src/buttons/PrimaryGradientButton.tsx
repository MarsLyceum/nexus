import React from 'react';
import {
    PressableProps,
    Pressable,
    StyleSheet,
    ViewStyle,
    Platform,
    View,
} from 'react-native';
import styled from 'styled-components/native';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
const ButtonText = styled.Text`
    color: white;
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
    gradient: {
        width: 280,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 25,
    },
});

export const PrimaryGradientButton: React.FC<PrimaryGradientButtonProps> = ({
    onPress,
    title,
    style,
}) => (
    <View style={[styles.shadowContainer, style]}>
        <Pressable onPress={onPress}>
            <ButtonText>{title}</ButtonText>
        </Pressable>
    </View>
);
