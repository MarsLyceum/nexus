import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Chat } from '../icons';
import { COLORS } from '../constants/colors';

export const ChatButton = ({ onPress }) => {
    return (
        <TouchableOpacity style={styles.button} onPress={onPress}>
            <Chat />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.Primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
