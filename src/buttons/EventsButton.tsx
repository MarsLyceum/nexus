import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Events } from '../icons';

export const EventsButton = ({ onPress }) => {
    return (
        <TouchableOpacity style={styles.button} onPress={onPress}>
            <Events />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#6F00AA',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
