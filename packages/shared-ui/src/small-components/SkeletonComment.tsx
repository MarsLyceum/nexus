import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

export const SkeletonComment: React.FC = () => (
    <View style={skeletonCommentStyles.container}>
        <View style={skeletonCommentStyles.avatar} />
        <View style={skeletonCommentStyles.content}>
            <View style={skeletonCommentStyles.line} />
            <View style={[skeletonCommentStyles.line, { width: '80%' }]} />
        </View>
    </View>
);

const skeletonCommentStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: COLORS.InactiveText,
    },
    content: {
        flex: 1,
        marginLeft: 10,
    },
    line: {
        height: 10,
        backgroundColor: COLORS.InactiveText,
        borderRadius: 5,
        marginBottom: 5,
    },
});
