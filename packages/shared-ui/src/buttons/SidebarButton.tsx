import React, { useMemo } from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';

import { useTheme, Theme } from '../theme';
import { BorderRadius, Spacing, Typography } from '../constants/designSystem';

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        button: {
            width: 45,
            height: 45,
            borderRadius: BorderRadius.Pill,
            backgroundColor: theme.colors.Primary,
            justifyContent: 'center',
            alignItems: 'center',
        },
        text: {
            ...Typography.Body,
            fontFamily: theme.fonts.primary?.semibold,
            marginLeft: Spacing.SM,
            color: theme.colors.ActiveText,
        },
    });
}

export const SidebarButton = ({
    onPress,
    icon,
    text,
}: {
    onPress: () => unknown;
    icon: React.JSX.Element;
    text: string;
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <View style={styles.button}>{icon}</View>
            <Text style={styles.text}>{text}</Text>
        </TouchableOpacity>
    );
};
