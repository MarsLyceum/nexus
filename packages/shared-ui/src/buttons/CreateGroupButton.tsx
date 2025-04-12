import React, { useMemo } from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { CreateGroup } from '../icons';
import { useTheme, Theme } from '../theme';

function createCreateGroupButtonStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
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
            marginLeft: 8, // Spacing between the button and the text
            fontSize: 14,
            color: theme.colors.ActiveText,
            fontFamily: 'Roboto_500Medium',
            fontWeight: 'semibold',
        },
    });
}

export const CreateGroupButton = ({ onPress }: { onPress: () => unknown }) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createCreateGroupButtonStyles(theme), [theme]);

    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <View style={styles.button}>
                <CreateGroup />
            </View>
            <Text style={styles.text}>Create a group</Text>
        </TouchableOpacity>
    );
};
