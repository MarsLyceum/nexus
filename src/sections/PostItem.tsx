import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Share,
    Platform,
    Alert,
    Dimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Helmet } from 'react-helmet';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { VoteActions } from './VoteActions';
import { BackArrow } from '../buttons';
import { COLORS } from '../constants';
import { HtmlRenderer } from './HtmlRenderer';
import { LargeImageModal } from './LargeImageModal';
import { AttachmentImageGallery } from './AttachmentImageGallery';
import { LinkPreview } from '../small-components';

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
    // Other styles remain unchanged.
});

// Helper to extract URLs from text using a refined regex.
const extractUrls = (text: string): string[] => {
    const urlRegex = /https?:\/\/[^\s"<]+/g;
    const matches = text.match(urlRegex);
    return matches ? matches : [];
};

// Helper to strip HTML tags from a string.
const stripHTML = (html: string): string => html.replace(/<[^>]+>/g, '').trim();

export type PostItemProps = {
    id: string;
    username: string;
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
    variant?: 'feed' | 'default' | 'details';
    shareUrl?: string;
    fromReddit?: boolean;
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
    const [modalVisible, setModalVisible] = useState(false);
    const [modalStartIndex, setModalStartIndex] = useState(0);

    const onUpvote = () => setVoteCount((prev) => prev + 1);
    const onDownvote = () => setVoteCount((prev) => prev - 1);

    const { width: windowWidth } = Dimensions.get('window');
    const innerWidth = windowWidth - 30; // available width for post content

    let avatarUri = '';
    let headerElement = null;

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

    const computedShareUrl =
        shareUrl ||
        (Platform.OS === 'web' && typeof window !== 'undefined'
            ? `${window.location.origin}/post/${id}`
            : `peeps://post/${id}`);

    // Prepare Open Graph meta tags for web only
    const ogDescription = stripHTML(content).substring(0, 160);
    const ogImage = thumbnail || avatarUri;
    const ogType = 'article';

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
                    message: `${title}\n\n${content.replace(/<[^>]+>/g, '')}\n\n${computedShareUrl}`,
                });
                if (result.action === Share.sharedAction) {
                    setShareCount((prev) => prev + 1);
                }
            } catch (error: any) {
                Alert.alert('Share error', error.message);
            }
        }
    };

    const handleImagePress = (index: number) => {
        setModalStartIndex(index);
        setModalVisible(true);
    };

    const attachmentsElement = attachmentUrls && attachmentUrls.length > 0 && (
        <AttachmentImageGallery
            attachmentUrls={attachmentUrls}
            onImagePress={handleImagePress}
        />
    );

    const urlsInContent = extractUrls(content);
    const plainContent = stripHTML(content);
    const isJustLink =
        urlsInContent.length === 1 && plainContent === urlsInContent[0];

    const contentElement = (
        <View style={styles.postContainer}>
            <View style={styles.postRow}>
                {onBackPress && (
                    <BackArrow onPress={onBackPress} style={styles.backArrow} />
                )}
                <ExpoImage
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
            {content !== '' && (
                <>
                    {!isJustLink && (
                        <HtmlRenderer
                            content={content}
                            preview={preview}
                            innerWidth={innerWidth}
                        />
                    )}
                    {urlsInContent.map((url, index) => (
                        <LinkPreview
                            key={index}
                            url={url}
                            containerWidth={innerWidth}
                        />
                    ))}
                </>
            )}
            {attachmentsElement}
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

    return (
        <>
            {Platform.OS === 'web' && (
                <Helmet>
                    <meta property="og:title" content={title} />
                    <meta property="og:description" content={ogDescription} />
                    <meta property="og:url" content={computedShareUrl} />
                    <meta property="og:image" content={ogImage} />
                    <meta property="og:type" content={ogType} />
                </Helmet>
            )}
            {onPress ? (
                <TouchableOpacity onPress={onPress}>
                    {contentElement}
                </TouchableOpacity>
            ) : (
                contentElement
            )}
            <LargeImageModal
                visible={modalVisible}
                attachments={attachmentUrls || []}
                initialIndex={modalStartIndex}
                onClose={() => setModalVisible(false)}
            />
        </>
    );
};
