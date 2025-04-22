import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

import { useTheme, Theme } from '../theme';

export const SkeletonComment: React.FC = () => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <View style={styles.container}>
            <View style={styles.avatar} />
            <View style={styles.content}>
                <View style={styles.line} />
                <View style={[styles.line, { width: '80%' }]} />
            </View>
        </View>
    );
};

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: 10,
        },
        avatar: {
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: theme.colors.InactiveText,
        },
        content: {
            flex: 1,
            marginLeft: 10,
        },
        line: {
            height: 10,
            backgroundColor: theme.colors.InactiveText,
            borderRadius: 5,
            marginBottom: 5,
        },
    });
}
