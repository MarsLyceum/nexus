import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

import { useTheme, Theme } from '../theme';

export const SkeletonPostItem: React.FC = () => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatar} />
                <View style={styles.userInfo}>
                    <View style={styles.username} />
                    <View style={styles.time} />
                </View>
            </View>
            <View style={styles.title} />
            <View style={styles.contentLine} />
            <View style={[styles.contentLine, { width: '80%' }]} />
            <View style={[styles.contentLine, { width: '90%' }]} />
        </View>
    );
};

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            backgroundColor: theme.colors.PrimaryBackground,
            padding: 15,
            borderRadius: 8,
            marginBottom: 15,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10,
        },
        avatar: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.InactiveText,
        },
        userInfo: {
            marginLeft: 10,
            flex: 1,
        },
        username: {
            width: '50%',
            height: 10,
            backgroundColor: theme.colors.InactiveText,
            borderRadius: 5,
            marginBottom: 5,
        },
        time: {
            width: '30%',
            height: 10,
            backgroundColor: theme.colors.InactiveText,
            borderRadius: 5,
        },
        title: {
            width: '80%',
            height: 20,
            backgroundColor: theme.colors.InactiveText,
            borderRadius: 5,
            marginBottom: 10,
        },
        contentLine: {
            width: '100%',
            height: 10,
            backgroundColor: theme.colors.InactiveText,
            borderRadius: 5,
            marginBottom: 5,
        },
    });
}
