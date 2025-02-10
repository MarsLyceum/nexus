import React from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';

import { Events } from '../icons';
import { COLORS } from '../constants';

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    button: {
        width: 32,
        height: 32,
        borderRadius: 20,
        backgroundColor: '#6F00AA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        marginLeft: 8, // Spacing between the button and the text
        fontSize: 14,
        color: COLORS.White,
        fontFamily: 'Roboto_500Medium',
        fontWeight: 'semibold',
    },
});

export const EventsButton = ({ onPress }: { onPress: () => unknown }) => (
    <TouchableOpacity style={styles.container} onPress={onPress}>
        <View style={styles.button}>
            <Events />
        </View>
        <Text style={styles.text}>Events</Text>
    </TouchableOpacity>
);
