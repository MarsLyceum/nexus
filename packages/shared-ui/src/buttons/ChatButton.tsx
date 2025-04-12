import React, { useMemo } from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { useTheme, Theme } from '../theme';

import { Chat } from '../icons';

function createChatButtonStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flexDirection: 'row', // Arrange children horizontally
            alignItems: 'center', // Center them vertically
        },
        button: {
            width: 32,
            height: 32,
            borderRadius: 20,
            backgroundColor: theme.colors.Primary,
            justifyContent: 'center',
            alignItems: 'center',
        },
        text: {
            marginLeft: 8, // Spacing between the icon and the text
            fontSize: 14,
            color: theme.colors.ActiveText,
            fontFamily: 'Roboto_500Medium',
            fontWeight: '500', // semibold (numeric value is recommended)
        },
    });
}

export const ChatButton = ({ onPress }: { onPress: () => unknown }) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createChatButtonStyles(theme), [theme]);

    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <View style={styles.button}>
                <Chat />
            </View>
            <Text style={styles.text}>Messages</Text>
        </TouchableOpacity>
    );
};
