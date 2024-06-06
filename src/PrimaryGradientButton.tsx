import React from 'react';
import {
    TouchableOpacityProps,
    TouchableOpacity,
    StyleSheet,
    ViewStyle,
    Platform,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import styled from 'styled-components/native';

const ButtonText = styled.Text`
    color: white;
    font-size: 16px;
    font-weight: bold;
`;

interface PrimaryGradientButtonProps extends TouchableOpacityProps {
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
        <TouchableOpacity onPress={onPress}>
            <LinearGradient
                style={styles.gradient}
                colors={['#A3109E', '#FF3A0F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                <ButtonText>{title}</ButtonText>
            </LinearGradient>
        </TouchableOpacity>
    </View>
);
