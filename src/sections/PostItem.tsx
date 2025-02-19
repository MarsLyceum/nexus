import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    ImageBackground,
    StyleSheet,
    TouchableOpacity,
    Share,
    Platform,
    Alert,
    Dimensions, // Used to get the window width for rendering HTML
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
// Import RenderHTML for rendering HTML content
import RenderHTML from 'react-native-render-html';
// Import htmlTruncate to safely truncate HTML content while preserving tags
import htmlTruncate from 'html-truncate';
// Import decode to decode HTML entities (in case the HTML is escaped)
import { decode } from 'html-entities';

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
    headerTextContainer: {
        flexDirection: 'column',
    },
    groupText: {
        color: COLORS.White,
        fontSize: 14,
        fontWeight: 'bold',
    },
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
    attachmentsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
        alignItems: 'flex-start', // cross-axis alignment
        justifyContent: 'flex-start', // main-axis alignment: left
    },
    // Thumbnail style for preview mode (100x100)
    attachmentImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
        marginRight: 5,
        marginBottom: 5,
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginTop: 10,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginLeft: 10,
    },
    shareCountText: {
        color: COLORS.White,
        fontSize: 12,
        marginLeft: 4,
    },
});

export type PostItemProps = {
    id: string;
    username: string;
    group?: string;
    time: string;
    title: string;
    content: string; // HTML string from React Quill
    upvotes: number;
    commentsCount: number;
    flair?: string;
    thumbnail?: string;
    preview?: boolean;
    onBackPress?: () => void;
    onPress?: () => void;
    variant?: 'feed' | 'default' | 'details';
    shareUrl?: string; // Optional override
    fromReddit?: boolean; // Indicates if the post is imported from Reddit
    // New prop for attached image URLs
    attachmentUrls?: string[];
};

function getUserAvatarUri(username: string, thumbnail?: string): string {
    return (
        thumbnail ||
        `https://picsum.photos/seed/${encodeURIComponent(
            username.replaceAll(/\W/g, '')
        )}/48`
    );
}

function getGroupAvatarUri(group: string, thumbnail?: string): string {
    return (
        thumbnail ||
        `https://picsum.photos/seed/${encodeURIComponent(
            group.replaceAll(/\W/g, '')
        )}/48`
    );
}

export const PostItem: React.FC<PostItemProps> = ({
    id,
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
    shareUrl,
    fromReddit = false,
    attachmentUrls,
}) => {
    const [voteCount, setVoteCount] = useState(upvotes);
    const [shareCount, setShareCount] = useState(0);

    const onUpvote = () => setVoteCount((prev) => prev + 1);
    const onDownvote = () => setVoteCount((prev) => prev - 1);

    // Get the window width for the RenderHTML component and for calculating image dimensions.
    const { width: windowWidth } = Dimensions.get('window');

    // Calculate the inner width of the post container (accounting for 15px padding on each side)
    const innerWidth = windowWidth - 30;

    // Define the details view image style for a 240p target.
    // For a typical 16:9 240p image, the resolution is roughly 854x240.
    // We scale the image to the inner width of the post and calculate the height accordingly.
    const detailsImageStyle = {
        width: innerWidth,
        height: innerWidth * (240 / 854), // maintain the 16:9 ratio based on a 240p target
    };

    // Decode the HTML in case it's escaped.
    const decodedContent = decode(content);
    // Only truncate if the content is longer than our limit.
    const truncatedContent =
        decodedContent.length > TRUNCATE_LENGTH
            ? htmlTruncate(decodedContent, TRUNCATE_LENGTH, {
                  ellipsis: '...',
              })
            : decodedContent;

    let avatarUri = '';
    let headerElement;

    if (variant === 'feed') {
        avatarUri = getUserAvatarUri(username, thumbnail);
        headerElement = (
            <Text style={styles.subText}>
                {username} • {time}
                {fromReddit ? ' • From Reddit' : ''}
            </Text>
        );
    } else if (variant === 'details') {
        avatarUri = getUserAvatarUri(username, thumbnail);
        headerElement = (
            <View style={styles.headerTextContainer}>
                <Text style={styles.groupText}>{group}</Text>
                <Text style={styles.subText}>
                    {username} • {time}
                    {fromReddit ? ' • From Reddit' : ''}
                </Text>
            </View>
        );
    } else {
        avatarUri = getGroupAvatarUri(group, thumbnail);
        headerElement = (
            <View style={styles.headerTextContainer}>
                <Text style={styles.groupText}>{group}</Text>
                <Text style={styles.subText}>
                    {username} • {time}
                    {fromReddit ? ' • From Reddit' : ''}
                </Text>
            </View>
        );
    }

    // Compute the share URL intelligently.
    const computedShareUrl =
        shareUrl ||
        (Platform.OS === 'web' && typeof window !== 'undefined'
            ? `${window.location.origin}/post/${id}`
            : `peeps://post/${id}`); // Mobile deep link

    const onShare = async () => {
        if (Platform.OS === 'web') {
            try {
                await navigator.clipboard.writeText(computedShareUrl);
                Toast.show({
                    type: 'success',
                    text1: 'Link copied to clipboard',
                    position: 'bottom',
                    visibilityTime: 2000,
                });
                setShareCount((prev) => prev + 1);
            } catch {
                Toast.show({
                    type: 'error',
                    text1: 'Unable to copy link',
                    position: 'bottom',
                    visibilityTime: 2000,
                });
            }
        } else {
            try {
                const result = await Share.share({
                    message: `${title}\n\n${decodedContent.replace(/<[^>]+>/g, '')}\n\n${computedShareUrl}`,
                });
                if (result.action === Share.sharedAction) {
                    setShareCount((prev) => prev + 1);
                }
            } catch (error: any) {
                Alert.alert('Share error', error.message);
            }
        }
    };

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
            {/* Render the HTML content.
          - In preview mode, we use the truncated decoded HTML.
          - Otherwise, we render the full decoded HTML.
      */}
            {decodedContent !== '' &&
                (preview ? (
                    <RenderHTML
                        contentWidth={windowWidth}
                        source={{ html: truncatedContent }}
                        baseStyle={styles.contentText}
                    />
                ) : (
                    <RenderHTML
                        contentWidth={windowWidth}
                        source={{ html: decodedContent }}
                        baseStyle={styles.contentText}
                    />
                ))}
            {/* Render attached images if any */}
            {attachmentUrls && attachmentUrls.length > 0 && (
                <View style={styles.attachmentsContainer}>
                    {attachmentUrls.map((url, index) =>
                        variant === 'details' ? (
                            <View
                                key={index}
                                style={{
                                    width: innerWidth,
                                    alignSelf: 'flex-start',
                                }}
                            >
                                <ImageBackground
                                    source={{ uri: url }}
                                    style={detailsImageStyle}
                                    imageStyle={{
                                        resizeMode: 'contain',
                                        alignSelf: 'flex-start',
                                    }}
                                />
                            </View>
                        ) : (
                            <Image
                                key={index}
                                source={{ uri: url }}
                                style={styles.attachmentImage}
                            />
                        )
                    )}
                </View>
            )}
            <View style={styles.actionsContainer}>
                <VoteActions
                    voteCount={voteCount}
                    onUpvote={onUpvote}
                    onDownvote={onDownvote}
                    commentCount={commentsCount}
                />
                <TouchableOpacity onPress={onShare} style={styles.shareButton}>
                    <MaterialCommunityIcons
                        name="share-outline"
                        size={20}
                        color={COLORS.White}
                    />
                    {shareCount > 0 && (
                        <Text style={styles.shareCountText}>{shareCount}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    return onPress ? (
        <TouchableOpacity onPress={onPress}>{contentElement}</TouchableOpacity>
    ) : (
        contentElement
    );
};
