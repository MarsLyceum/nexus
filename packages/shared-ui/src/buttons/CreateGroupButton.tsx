import React, { useMemo } from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';

import { CreateGroup } from '../icons';
import { useTheme, Theme } from '../theme';
import { BorderRadius, Spacing, Typography } from '../constants/designSystem';

function createCreateGroupButtonStyles(theme: Theme) {
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
