// Header.tsx
import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';

import { useNexusRouter } from '../hooks';
import { BackArrow } from '../buttons';
import { useTheme, Theme } from '../theme';
import { Spacing, Opacity, Typography } from '../constants/designSystem';
import { toRgba } from '../utils';

function createStyles(theme: Theme) {
    return StyleSheet.create({
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: Spacing.LG,
            borderBottomWidth: 1,
            borderBottomColor: toRgba(
                theme.colors.ActiveText,
                Opacity.BorderMedium
            ),
        },
        channelName: {
            ...Typography.SectionHeading,
            fontFamily: theme.fonts.primary?.bold,
            color: theme.colors.ActiveText,
            marginLeft: Spacing.SM,
        },
    });
}

export const Header = ({
    isLargeScreen,
    headerText,
}: {
    isLargeScreen: boolean;
    headerText: string;
}) => {
    const { goBack } = useNexusRouter();
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <View style={styles.header}>
            {!isLargeScreen && <BackArrow onPress={goBack} />}
            <Text style={styles.channelName}>{headerText}</Text>
        </View>
    );
};
