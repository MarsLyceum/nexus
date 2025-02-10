import React from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';

import { Chat } from '../icons';
import { COLORS } from '../constants';

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row', // Arrange children horizontally
        alignItems: 'center', // Center them vertically
    },
    button: {
        width: 32,
        height: 32,
        borderRadius: 20,
        backgroundColor: COLORS.Primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        marginLeft: 8, // Spacing between the icon and the text
        fontSize: 14,
        color: COLORS.White,
        fontFamily: 'Roboto_500Medium',
        fontWeight: '500', // semibold (numeric value is recommended)
    },
});

export const ChatButton = ({ onPress }: { onPress: () => unknown }) => (
    <TouchableOpacity style={styles.container} onPress={onPress}>
        <View style={styles.button}>
            <Chat />
        </View>
        <Text style={styles.text}>Messages</Text>
    </TouchableOpacity>
);
