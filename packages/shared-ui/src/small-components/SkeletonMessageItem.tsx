// SkeletonMessageItem.tsx
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

import { useTheme, Theme } from '../theme';

export const SkeletonMessageItem: React.FC = () => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <View style={styles.skeletonMessageContainer}>
            <View style={styles.skeletonAvatar} />
            <View style={styles.skeletonMessageContent}>
                <View style={styles.skeletonUsername} />
                <View style={styles.skeletonTime} />
                <View style={styles.skeletonText} />
            </View>
        </View>
    );
};

function createStyles(theme: Theme) {
    return StyleSheet.create({
        skeletonMessageContainer: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            padding: 15,
            width: '100%',
        },
        skeletonAvatar: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.InactiveText,
            marginRight: 10,
        },
        skeletonMessageContent: {
            flex: 1,
        },
        skeletonUsername: {
            width: 120,
            height: 14,
            borderRadius: 4,
            backgroundColor: theme.colors.InactiveText,
            marginBottom: 4,
        },
        skeletonTime: {
            width: 60,
            height: 10,
            borderRadius: 4,
            backgroundColor: theme.colors.InactiveText,
            marginBottom: 4,
        },
        skeletonText: {
            width: '80%',
            height: 14,
            borderRadius: 4,
            backgroundColor: theme.colors.InactiveText,
        },
    });
}
