import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Events } from '../icons';

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

export const EventsButton = ({ onPress }: { onPress: () => unknown }) => (
    <TouchableOpacity style={styles.button} onPress={onPress}>
        <Events />
    </TouchableOpacity>
);
