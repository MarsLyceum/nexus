import React, { useMemo } from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';

import { useTheme, Theme } from '../theme';

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flexDirection: 'row', // Arrange children horizontally
            alignItems: 'center', // Center them vertically
        },
        button: {
            width: 45,
            height: 45,
            borderRadius: 23,
            backgroundColor: theme.colors.Primary,
            justifyContent: 'center',
            alignItems: 'center',
        },
        text: {
            marginLeft: 8, // Spacing between the icon and the text
            fontSize: 16,
            color: theme.colors.ActiveText,
            fontFamily: 'Roboto_500Medium',
            fontWeight: '500', // semibold (numeric value is recommended)
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
