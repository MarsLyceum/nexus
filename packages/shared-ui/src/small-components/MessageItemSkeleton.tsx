// MessageItemSkeleton.tsx
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

import { useTheme, Theme } from '../theme';

export type MessageItemSkeletonProps = {
    width: number;
};

export const MessageItemSkeleton: React.FC<MessageItemSkeletonProps> = ({
    width,
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <View style={styles.container}>
            {/* Skeleton for avatar */}
            <View style={styles.avatarSkeleton} />

            {/* Skeleton for message content */}
            <View style={styles.contentSkeleton}>
                <View style={styles.headerSkeleton}>
                    <View
                        style={[
                            styles.usernameSkeleton,
                            { width: width * 0.3 },
                        ]}
                    />
                    <View style={styles.timeSkeleton} />
                </View>
                <View style={styles.textSkeleton} />
                <View style={styles.textSkeletonShort} />
            </View>
        </View>
    );
};

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            padding: 15,
            width: '100%',
        },
        avatarSkeleton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.InactiveText,
            marginRight: 10,
        },
        contentSkeleton: {
            flex: 1,
        },
        headerSkeleton: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
        },
        usernameSkeleton: {
            height: 14,
            borderRadius: 4,
            backgroundColor: theme.colors.InactiveText,
            marginRight: 8,
        },
        timeSkeleton: {
            width: 50,
            height: 12,
            borderRadius: 4,
            backgroundColor: theme.colors.InactiveText,
        },
        textSkeleton: {
            width: '100%',
            height: 14,
            borderRadius: 4,
            backgroundColor: theme.colors.InactiveText,
            marginBottom: 4,
        },
        textSkeletonShort: {
            width: '60%',
            height: 14,
            borderRadius: 4,
            backgroundColor: theme.colors.InactiveText,
        },
    });
}
