import React from 'react';
import {
    TouchableOpacityProps,
    TouchableOpacity,
    StyleSheet,
    ViewStyle,
    Platform,
    View,
} from 'react-native';
import styled from 'styled-components/native';

const ButtonText = styled.Text`
    color: #a3119f;
    font-size: 16px;
    font-weight: bold;
`;

interface SecondaryButtonProps extends TouchableOpacityProps {
    title: string;
    style?: ViewStyle;
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 25,
        overflow: 'hidden',
        width: 280,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#EBEAEA',
    },
    shadowContainer: {
        borderRadius: 25,
        width: 280,
        height: 50,
        marginLeft: 3, // Adding margin to prevent cutting off
        ...Platform.select({
            web: {
                boxShadow: '0px 2px 5px rgba(0,0,0,0.25)',
            },
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
            },
            android: {
                elevation: 5,
            },
        }),
    },
});

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
    onPress,
    title,
    style,
}) => (
    <View style={[styles.shadowContainer, style]}>
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <ButtonText>{title}</ButtonText>
        </TouchableOpacity>
    </View>
);
