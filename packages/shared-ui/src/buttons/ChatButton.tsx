import React, { useMemo } from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';

import { useTheme, Theme } from '../theme';
import { BorderRadius, Spacing, Typography } from '../constants/designSystem';
import { Chat } from '../icons';

function createChatButtonStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        button: {
            width: 32,
            height: 32,
            borderRadius: BorderRadius.Pill,
            backgroundColor: theme.colors.Primary,
            justifyContent: 'center',
            alignItems: 'center',
        },
        text: {
            ...Typography.Code,
            fontFamily: theme.fonts.primary?.semibold,
            marginLeft: Spacing.SM,
            color: theme.colors.ActiveText,
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
