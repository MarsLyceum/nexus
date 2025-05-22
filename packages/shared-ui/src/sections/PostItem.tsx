import React, { useState, useMemo } from 'react';
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
import Toast from 'react-native-toast-message';

import { VoteActions } from './VoteActions';
import { BackArrow } from '../buttons';
import { useTheme, Theme } from '../theme';
import { MediaDetailsModal } from './MediaDetailsModal';
import { AttachmentImageGallery } from './AttachmentImageGallery';
import {
    LinkPreview,
    MarkdownRenderer,
    ActionButton,
    NexusImage,
} from '../small-components';
import { stripHtml, extractUrls } from '../utils';
import { Share as ShareIcon } from '../icons';

function createStyles(theme: Theme) {
    return StyleSheet.create({
        postContainer: {
            backgroundColor: theme.colors.PrimaryBackground,
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
            color: theme.colors.ActiveText,
            fontSize: 14,
            fontWeight: 'bold',
        },
        subText: {
            color: theme.colors.InactiveText,
            fontSize: 12,
        },
        postTitle: {
            color: theme.colors.ActiveText,
            fontSize: 16,
            fontWeight: 'bold',
            marginBottom: 10,
        },
        flairContainer: {
            alignSelf: 'flex-start',
            paddingHorizontal: 10,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: theme.colors.Primary,
            marginBottom: 10,
        },
        flairText: {
            color: theme.colors.ActiveText,
            fontSize: 12,
        },
        contentText: {
            color: theme.colors.ActiveText,
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
            color: theme.colors.ActiveText,
            fontSize: 12,
            marginLeft: 4,
        },
    });
}

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
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

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
        (Platform.OS === 'web' && typeof globalThis !== 'undefined'
            ? `${globalThis.location.origin}/post/${id}`
            : `nexus://post/${id}`);

    const urlsInContent = extractUrls(content);

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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                <NexusImage
                    source={avatarUri}
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
                        <ShareIcon />
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
            {onPress ? (
                <TouchableOpacity onPress={onPress}>
                    {contentElement}
                </TouchableOpacity>
            ) : (
                contentElement
            )}
            <MediaDetailsModal
                visible={modalVisible}
                attachments={attachmentUrls || []}
                initialIndex={modalStartIndex}
                onClose={() => setModalVisible(false)}
            />
        </>
    );
};
