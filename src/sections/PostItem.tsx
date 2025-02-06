// PostItem.tsx
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { VoteActions } from './VoteActions';
import { BackArrow } from '../buttons';
import { COLORS } from '../constants';

const TRUNCATE_LENGTH = 100;

const styles = StyleSheet.create({
    postContainer: {
        backgroundColor: COLORS.PrimaryBackground,
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        borderWidth: 0,
        borderColor: COLORS.InactiveText,
    },
    postRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    backArrow: {
        marginRight: 10,
    },
    userPic: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
    },
    subredditUserText: {
        color: COLORS.InactiveText,
        fontSize: 13,
    },
    postTitle: {
        color: COLORS.White,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    flairContainer: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: COLORS.Primary,
        marginBottom: 10,
    },
    flairText: {
        color: COLORS.White,
        fontSize: 12,
    },
    contentText: {
        color: COLORS.White,
        fontSize: 14,
        marginBottom: 10,
    },
});

export type PostItemProps = {
    user: string;
    time: string;
    title: string;
    content: string;
    upvotes: number;
    commentsCount: number;
    flair?: string;
    thumbnail?: string;
    preview?: boolean; // If true, show a truncated preview of the content
    onBackPress?: () => void;
    onPress?: () => void;
};

function getAvatarUri(user: string, thumbnail?: string): string {
    return (
        thumbnail ||
        `https://picsum.photos/seed/${user.replace(/[^a-zA-Z0-9]/g, '')}/48`
    );
}

export const PostItem: React.FC<PostItemProps> = ({
    user,
    time,
    title,
    content,
    upvotes,
    commentsCount,
    flair,
    thumbnail,
    preview = false,
    onBackPress,
    onPress,
}) => {
    const [voteCount, setVoteCount] = useState(upvotes);
    const onUpvote = () => setVoteCount((prev) => prev + 1);
    const onDownvote = () => setVoteCount((prev) => prev - 1);

    // Truncate content if in preview mode
    const displayedContent =
        preview && content.length > TRUNCATE_LENGTH
            ? content.substring(0, TRUNCATE_LENGTH) + '...'
            : content;

    const contentElement = (
        <View style={styles.postContainer}>
            <View style={styles.postRow}>
                {onBackPress && (
                    <BackArrow onPress={onBackPress} style={styles.backArrow} />
                )}
                <Image
                    source={{ uri: getAvatarUri(user, thumbnail) }}
                    style={styles.userPic}
                />
                <Text style={styles.subredditUserText}>
                    {user} • {time}
                </Text>
            </View>
            <Text style={styles.postTitle}>{title}</Text>
            {flair ? (
                <View style={styles.flairContainer}>
                    <Text style={styles.flairText}>{flair}</Text>
                </View>
            ) : undefined}
            <Text style={styles.contentText}>{displayedContent}</Text>
            <VoteActions
                voteCount={voteCount}
                onUpvote={onUpvote}
                onDownvote={onDownvote}
                commentCount={commentsCount}
            />
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress}>
                {contentElement}
            </TouchableOpacity>
        );
    }
    return contentElement;
};
