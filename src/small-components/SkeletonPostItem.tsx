import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

export const SkeletonPostItem: React.FC = () => (
    <View style={skeletonStyles.container}>
        <View style={skeletonStyles.header}>
            <View style={skeletonStyles.avatar} />
            <View style={skeletonStyles.userInfo}>
                <View style={skeletonStyles.username} />
                <View style={skeletonStyles.time} />
            </View>
        </View>
        <View style={skeletonStyles.title} />
        <View style={skeletonStyles.contentLine} />
        <View style={[skeletonStyles.contentLine, { width: '80%' }]} />
        <View style={[skeletonStyles.contentLine, { width: '90%' }]} />
    </View>
);

const skeletonStyles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.PrimaryBackground,
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
        backgroundColor: COLORS.InactiveText,
    },
    userInfo: {
        marginLeft: 10,
        flex: 1,
    },
    username: {
        width: '50%',
        height: 10,
        backgroundColor: COLORS.InactiveText,
        borderRadius: 5,
        marginBottom: 5,
    },
    time: {
        width: '30%',
        height: 10,
        backgroundColor: COLORS.InactiveText,
        borderRadius: 5,
    },
    title: {
        width: '80%',
        height: 20,
        backgroundColor: COLORS.InactiveText,
        borderRadius: 5,
        marginBottom: 10,
    },
    contentLine: {
        width: '100%',
        height: 10,
        backgroundColor: COLORS.InactiveText,
        borderRadius: 5,
        marginBottom: 5,
    },
});
