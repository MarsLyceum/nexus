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
import { SolitoImage } from 'solito/image';
import { Helmet } from 'react-helmet';
// Removed: import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import Svg, { Path } from 'react-native-svg';

import { VoteActions } from './VoteActions';
import { BackArrow } from '../buttons';
import { COLORS } from '../constants';
import { ImageDetailsModal } from './ImageDetailsModal';
import { AttachmentImageGallery } from './AttachmentImageGallery';
import {
    LinkPreview,
    MarkdownRenderer,
    ActionButton,
} from '../small-components';
import { stripHtml, extractUrls } from '../utils';

// New inline SVG component replicating the share icon
export const ShareIconSvg = ({
    color = COLORS.MainText,
    size = 18,
}: {
    color?: string;
    size?: number;
}) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            fill={color}
            d="M18,16.08C17.24,16.08 16.56,16.38 16.05,16.84L8.91,12.7C8.96,12.47 9,12.24 9,12C9,11.76 8.96,11.53 8.91,11.3L15.96,7.19C16.5,7.69 17.22,8 18,8C19.66,8 21,6.66 21,5C21,3.34 19.66,2 18,2C16.34,2 15,3.34 15,5C15,5.24 15.04,5.47 15.09,5.7L8.04,9.81C7.5,9.31 6.78,9 6,9C4.34,9 3,10.34 3,12C3,13.66 4.34,15 6,15C6.78,15 7.5,14.69 8.04,14.19L15.16,18.36C15.11,18.57 15.08,18.79 15.08,19C15.08,20.66 16.42,22 18.08,22C19.74,22 21.08,20.66 21.08,19C21.08,17.34 19.74,16 18.08,16Z"
        />
    </Svg>
);

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
    // Container for grouping the share button and its count.
    buttonGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
    },
    // Share button style matching the vote actions.
    shareButton: {
        width: 45,
        height: 45,
        borderRadius: 23,
        justifyContent: 'center',
        alignItems: 'center',
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
    attachmentUrls?: string[];
};

function getUserAvatarUri(username: string, thumbnail?: string): string {
    return (
        thumbnail ||
        `https://picsum.photos/seed/${encodeURIComponent(username.replaceAll(/\W/g, ''))}/48`
    );
}

function getGroupAvatarUri(group: string, thumbnail?: string): string {
    return (
        thumbnail ||
        `https://picsum.photos/seed/${encodeURIComponent(group.replaceAll(/\W/g, ''))}/48`
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
    attachmentUrls,
}) => {
    const [voteCount, setVoteCount] = useState(upvotes);
    const [shareCount, setShareCount] = useState(0);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalStartIndex, setModalStartIndex] = useState(0);

    // New state to store the measured container width
    const [containerWidth, setContainerWidth] = useState<number>(0);

    const onUpvote = () => setVoteCount((prev) => prev + 1);
    const onDownvote = () => setVoteCount((prev) => prev - 1);

    // Compute inner width based on measured container width with a fallback
    const innerWidth =
        containerWidth > 0
            ? containerWidth - 50
            : Dimensions.get('window').width - 30;

    let avatarUri = '';
    let headerElement;

    if (variant === 'feed') {
        avatarUri = getUserAvatarUri(username, thumbnail);
        headerElement = (
            <Text style={styles.subText}>
                {username} • {time}
            </Text>
        );
    } else if (variant === 'details') {
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

    const computedShareUrl =
        shareUrl ||
        (Platform.OS === 'web' && typeof window !== 'undefined'
            ? `${window.location.origin}/post/${id}`
            : `nexus://post/${id}`);

    // Prepare Open Graph meta tags for web only.
    const ogDescription = stripHtml(content).slice(0, 160);
    // Use the first attachment if available,
    // otherwise use the first URL found in the content,
    // and fall back to the thumbnail/avatar.
    const urlsInContent = extractUrls(content);
    const ogImage =
        attachmentUrls && attachmentUrls.length > 0
            ? attachmentUrls[0]
            : urlsInContent && urlsInContent.length > 0
              ? urlsInContent[0]
              : thumbnail || avatarUri;

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
                    message: `${title}\n\n${content.replaceAll(/<[^>]+>/g, '')}\n\n${computedShareUrl}`,
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
            containerWidth={innerWidth}
        />
    );

    const plainContent = stripHtml(content);
    const isJustLink =
        urlsInContent.length === 1 && plainContent === urlsInContent[0];

    const contentElement = (
        // Added onLayout to measure the container's width
        <View
            style={styles.postContainer}
            onLayout={(event) => {
                setContainerWidth(event.nativeEvent.layout.width);
            }}
        >
            <View style={styles.postRow}>
                {onBackPress && (
                    <BackArrow onPress={onBackPress} style={styles.backArrow} />
                )}
                <SolitoImage
                    src={avatarUri}
                    width={36}
                    height={36}
                    alt={`${variant === 'feed' ? 'User' : 'Group'} Avatar`}
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
                        <MarkdownRenderer text={content} preview={preview} />
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
                <View style={styles.buttonGroup}>
                    <ActionButton
                        onPress={onShare}
                        tooltipText="Share"
                        transparent
                        style={styles.shareButton}
                    >
                        <ShareIconSvg color={COLORS.MainText} size={18} />
                    </ActionButton>
                    {shareCount > 0 && (
                        <Text style={styles.shareCountText}>{shareCount}</Text>
                    )}
                </View>
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
                    <meta property="og:type" content="article" />
                </Helmet>
            )}
            {onPress ? (
                <TouchableOpacity onPress={onPress}>
                    {contentElement}
                </TouchableOpacity>
            ) : (
                contentElement
            )}
            <ImageDetailsModal
                visible={modalVisible}
                attachments={attachmentUrls || []}
                initialIndex={modalStartIndex}
                onClose={() => setModalVisible(false)}
            />
        </>
    );
};
