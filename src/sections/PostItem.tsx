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
        marginVertical: 10,
    },
    postRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    backArrow: {
        marginRight: 10,
    },
    // Avatar styles for both variants
    userPic: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
    },
    groupPic: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
    },
    // For default & details variants: group is prominent, with username & time in a subheading.
    headerTextContainer: {
        flexDirection: 'column',
    },
    groupText: {
        color: COLORS.White,
        fontSize: 14,
        fontWeight: 'bold',
    },
    // For both variants: username and time text.
    subText: {
        color: COLORS.InactiveText,
        fontSize: 12,
    },
    postTitle: {
        color: COLORS.White,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    flairContainer: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 10,
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
    username: string;
    /** For non-feed items, this should be provided. */
    group?: string;
    time: string;
    title: string;
    content: string;
    upvotes: number;
    commentsCount: number;
    flair?: string;
    thumbnail?: string;
    preview?: boolean;
    onBackPress?: () => void;
    onPress?: () => void;
    /**
     * Variants:
     * - 'feed': for the feed page—shows the user’s picture and username only.
     * - 'default': for all other screens—shows the group name prominently along with the username and time, using the group’s picture.
     * - 'details': for the post details screen—uses the user's picture, but displays the group prominently with the username and time as secondary.
     */
    variant?: 'feed' | 'default' | 'details';
};

function getUserAvatarUri(username: string, thumbnail?: string): string {
    return (
        thumbnail ||
        `https://picsum.photos/seed/${encodeURIComponent(
            username.replace(/[^\w]/g, '')
        )}/48`
    );
}

function getGroupAvatarUri(group: string, thumbnail?: string): string {
    return (
        thumbnail ||
        `https://picsum.photos/seed/${encodeURIComponent(
            group.replace(/[^\w]/g, '')
        )}/48`
    );
}

export const PostItem: React.FC<PostItemProps> = ({
    username,
    group = '',
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
    variant = 'default',
}) => {
    const [voteCount, setVoteCount] = useState(upvotes);
    const onUpvote = () => setVoteCount((prev) => prev + 1);
    const onDownvote = () => setVoteCount((prev) => prev - 1);

    const displayedContent =
        preview && content.length > TRUNCATE_LENGTH
            ? `${content.slice(0, TRUNCATE_LENGTH)}...`
            : content;

    let avatarUri = '';
    let headerElement = null;

    if (variant === 'feed') {
        // Feed variant: uses the user's picture and displays only the username and time.
        avatarUri = getUserAvatarUri(username, thumbnail);
        headerElement = (
            <Text style={styles.subText}>
                {username} • {time}
            </Text>
        );
    } else if (variant === 'details') {
        // Details variant: uses the user's picture, but displays the group prominently,
        // with the username and time as secondary.
        avatarUri = getUserAvatarUri(username, thumbnail);
        headerElement = (
            <View style={styles.headerTextContainer}>
                <Text style={styles.groupText}>{group}</Text>
                <Text style={styles.subText}>
                    {username} • {time}
                </Text>
            </View>
        );
    } else {
        // Default variant: uses the group's picture and displays the group prominently,
        // along with the username and time.
        avatarUri = getGroupAvatarUri(group, thumbnail);
        headerElement = (
            <View style={styles.headerTextContainer}>
                <Text style={styles.groupText}>{group}</Text>
                <Text style={styles.subText}>
                    {username} • {time}
                </Text>
            </View>
        );
    }

    const contentElement = (
        <View style={styles.postContainer}>
            <View style={styles.postRow}>
                {onBackPress && (
                    <BackArrow onPress={onBackPress} style={styles.backArrow} />
                )}
                <Image
                    source={{ uri: avatarUri }}
                    style={
                        variant === 'feed' ? styles.userPic : styles.groupPic
                    }
                />
                {headerElement}
            </View>
            <Text style={styles.postTitle}>{title}</Text>
            {flair && (
                <View style={styles.flairContainer}>
                    <Text style={styles.flairText}>{flair}</Text>
                </View>
            )}
            {displayedContent !== '' && (
                <Text style={styles.contentText}>{displayedContent}</Text>
            )}
            <VoteActions
                voteCount={voteCount}
                onUpvote={onUpvote}
                onDownvote={onDownvote}
                commentCount={commentsCount}
            />
        </View>
    );

    return onPress ? (
        <TouchableOpacity onPress={onPress}>{contentElement}</TouchableOpacity>
    ) : (
        contentElement
    );
};
