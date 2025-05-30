import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

import { useTheme, Theme } from '../theme';

export type LinkPreviewSkeletonProps = {
    containerWidth?: number;
};

export const LinkPreviewSkeleton: React.FC<LinkPreviewSkeletonProps> = ({
    containerWidth,
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <View
            style={[
                styles.linkPreviewContainer,
                containerWidth ? { width: containerWidth } : {},
            ]}
        >
            {/* Skeleton Title */}
            <View style={styles.skeletonTitle} />
            {/* Skeleton Description (two lines) */}
            <View style={styles.skeletonDescription} />
            <View style={styles.skeletonDescription} />
            {/* Skeleton Site */}
            <View style={styles.skeletonSite} />
        </View>
    );
};

function createStyles(theme: Theme) {
    return StyleSheet.create({
        linkPreviewContainer: {
            borderLeftWidth: 5,
            borderLeftColor: theme.colors.AppBackground,
            backgroundColor: theme.colors.TertiaryBackground,
            padding: 10,
            marginVertical: 5,
        },
        skeletonImage: {
            width: '100%',
            height: 150,
            borderRadius: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            marginBottom: 5,
        },
        skeletonTitle: {
            width: '70%',
            height: 16,
            borderRadius: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            marginBottom: 3,
        },
        skeletonDescription: {
            width: '100%',
            height: 14,
            borderRadius: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            marginBottom: 2,
        },
        skeletonSite: {
            width: '50%',
            height: 12,
            borderRadius: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            marginTop: 5,
        },
    });
}
