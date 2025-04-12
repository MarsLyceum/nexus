import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

import { useTheme, Theme } from '../theme';

// A skeleton placeholder for a conversation item.
export const ConversationSkeleton: React.FC = () => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <View style={styles.skeletonItem}>
            <View style={styles.skeletonAvatar} />
            <View style={styles.skeletonTextContainer}>
                <View style={styles.skeletonTitle} />
                <View style={styles.skeletonSubtitle} />
            </View>
        </View>
    );
};

function createStyles(theme: Theme) {
    return StyleSheet.create({
        // Skeleton styles using palette colors
        skeletonItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10,
            paddingHorizontal: 15,
        },
        skeletonAvatar: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.InactiveText,
        },
        skeletonTextContainer: {
            flex: 1,
            marginLeft: 10,
        },
        skeletonTitle: {
            width: '50%',
            height: 10,
            backgroundColor: theme.colors.InactiveText,
            borderRadius: 4,
            marginBottom: 6,
        },
        skeletonSubtitle: {
            width: '30%',
            height: 10,
            backgroundColor: theme.colors.InactiveText,
            borderRadius: 4,
        },
    });
}
