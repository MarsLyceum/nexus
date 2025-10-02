// MessageItemSkeleton.tsx
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

import { useTheme, Theme } from '../theme';
import { toRgba } from '../utils';
import { BorderRadius, Spacing, Typography } from '../constants/designSystem';

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
            padding: Spacing.LG,
            width: '100%',
        },
        avatarSkeleton: {
            width: 40,
            height: 40,
            borderRadius: BorderRadius.XL,
            backgroundColor: toRgba(theme.colors.InactiveText, 0.3),
            marginRight: Spacing.SM,
        },
        contentSkeleton: {
            flex: 1,
        },
        headerSkeleton: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: Spacing.SM,
        },
        usernameSkeleton: {
            height: Typography.BodySmall.fontSize,
            borderRadius: BorderRadius.ExtraSmall,
            backgroundColor: toRgba(theme.colors.InactiveText, 0.3),
            marginRight: Spacing.SM,
        },
        timeSkeleton: {
            width: 50,
            height: Typography.Eyebrow.fontSize,
            borderRadius: BorderRadius.ExtraSmall,
            backgroundColor: toRgba(theme.colors.InactiveText, 0.3),
        },
        textSkeleton: {
            width: '100%',
            height: Typography.BodySmall.fontSize,
            borderRadius: BorderRadius.ExtraSmall,
            backgroundColor: toRgba(theme.colors.InactiveText, 0.3),
            marginBottom: Spacing.XS,
        },
        textSkeletonShort: {
            width: '60%',
            height: Typography.BodySmall.fontSize,
            borderRadius: BorderRadius.ExtraSmall,
            backgroundColor: toRgba(theme.colors.InactiveText, 0.3),
        },
    });
}
