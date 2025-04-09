// SkeletonMessageItem.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

export const SkeletonMessageItem: React.FC = () => (
    <View style={styles.skeletonMessageContainer}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonMessageContent}>
            <View style={styles.skeletonUsername} />
            <View style={styles.skeletonTime} />
            <View style={styles.skeletonText} />
        </View>
    </View>
);

const styles = StyleSheet.create({
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
        backgroundColor: COLORS.InactiveText,
        marginRight: 10,
    },
    skeletonMessageContent: {
        flex: 1,
    },
    skeletonUsername: {
        width: 120,
        height: 14,
        borderRadius: 4,
        backgroundColor: COLORS.InactiveText,
        marginBottom: 4,
    },
    skeletonTime: {
        width: 60,
        height: 10,
        borderRadius: 4,
        backgroundColor: COLORS.InactiveText,
        marginBottom: 4,
    },
    skeletonText: {
        width: '80%',
        height: 14,
        borderRadius: 4,
        backgroundColor: COLORS.InactiveText,
    },
});
