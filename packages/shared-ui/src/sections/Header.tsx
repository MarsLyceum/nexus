// Header.tsx
import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';

import { useNexusRouter } from '../hooks';
import { BackArrow } from '../buttons';
import { useTheme, Theme } from '../theme';

function createStyles(theme: Theme) {
    return StyleSheet.create({
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 15,
            borderBottomWidth: 1,
            borderBottomColor: '#4A3A5A',
        },
        channelName: {
            fontSize: 18,
            color: theme.colors.ActiveText,
            fontWeight: 'bold',
        },
    });
}

export const Header = ({
    isLargeScreen,
    headerText,
    children, // extra content
}: {
    isLargeScreen: boolean;
    headerText: string;
    children?: React.JSX.Element;
}) => {
    const { goBack } = useNexusRouter();
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <View style={styles.header}>
            {!isLargeScreen && <BackArrow onPress={goBack} />}
            <Text style={styles.channelName}>{headerText}</Text>
            {children}
        </View>
    );
};
