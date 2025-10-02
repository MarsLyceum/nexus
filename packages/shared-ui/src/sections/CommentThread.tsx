import React, { useState, useContext, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    LayoutChangeEvent,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useApolloClient } from '@apollo/client';

import { useNexusRouter, useIsComputer } from '../hooks';
import { VoteActions } from './VoteActions';
import { useTheme, Theme } from '../theme';
import { CurrentCommentContext } from '../providers';
import { NexusImage } from '../small-components/NexusImage';
import { MarkdownRenderer } from '../small-components/MarkdownRenderer';
import { LinkPreview } from '../small-components/LinkPreview';
import { CommentEditor } from '../small-components/CommentEditor';
import { ActionButton } from '../small-components/ActionButton';
import { stripHtml, extractUrls, getRelativeTime } from '../utils';
import { FETCH_POST_COMMENTS_QUERY } from '../queries';
import { AttachmentImageGallery } from './AttachmentImageGallery';
import { MediaDetailsModal } from './MediaDetailsModal';
import { BorderRadius, Spacing, Typography } from '../constants/designSystem';

function createStyles(theme: Theme) {
    return StyleSheet.create({
        commentContainer: {
            borderLeftWidth: 3,
            borderLeftColor: theme.colors.TextInput,
            marginBottom: Spacing.LG,
        },
        singleComment: {
            backgroundColor: theme.colors.PrimaryBackground,
            borderRadius: BorderRadius.ExtraSmall - 2,
            paddingLeft: Spacing.XS / 2,
            paddingTop: Spacing.LG,
            paddingBottom: Spacing.LG,
        },
        commentHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: Spacing.XS + 2,
        },
        collapseIcon: {
            marginRight: Spacing.SM,
        },
        commentUserPic: {
            width: 28,
            height: 28,
            borderRadius: BorderRadius.Small + 2,
            marginRight: Spacing.SM,
        },
        commentUser: {
            ...Typography.BodySmall,
            fontFamily: theme.fonts.primary?.semibold,
            color: theme.colors.ActiveText,
            marginRight: Spacing.XS + 2,
        },
        opBadge: {
            ...Typography.Eyebrow,
            fontFamily: theme.fonts.secondary?.semibold,
            backgroundColor: theme.colors.Primary,
            color: theme.colors.ActiveText,
            paddingHorizontal: Spacing.XS,
            paddingVertical: Spacing.XS / 2,
            borderRadius: BorderRadius.ExtraSmall - 4,
            marginRight: Spacing.XS + 2,
        },
        commentTime: {
            ...Typography.Caption,
            fontFamily: theme.fonts.secondary?.regular,
            color: theme.colors.InactiveText,
        },
        collapsedCommentText: {
            ...Typography.Caption,
            fontFamily: theme.fonts.primary?.regular,
            color: theme.colors.InactiveText,
            marginLeft: Spacing.MD,
            flex: 1,
        },
        commentContentWrapper: {
            alignSelf: 'stretch',
            flex: 1,
            maxWidth: '100%',
            paddingLeft: Spacing.MD,
            marginTop: Spacing.XS,
        },
        commentText: {
            ...Typography.Code,
            fontFamily: theme.fonts.primary?.regular,
            color: theme.colors.ActiveText,
        },
        actionsRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            marginTop: Spacing.SM,
        },
        replyIcon: {
            marginRight: Spacing.MD,
        },
        voteActionsContainer: {},
        replyInputContainer: {
            marginTop: Spacing.MD,
        },
        continueConversationButton: {
            marginTop: Spacing.MD,
            padding: Spacing.SM,
            backgroundColor: theme.colors.Primary,
            borderRadius: BorderRadius.ExtraSmall - 4,
            alignSelf: 'center',
        },
        continueConversationText: {
            ...Typography.Code,
            fontFamily: theme.fonts.primary?.semibold,
            color: theme.colors.ActiveText,
        },
    });
}

export type CommentNode = {
    id: string;
    user: string;
    postedAt: string;
    edited: false;
    upvotes: number;
    content: string;
    parentCommentId: string | null;
    postedByUserId: string;
    hasChildren: boolean;
    attachmentUrls?: string[];
    children: CommentNode[];
};

type CommentThreadProps = {
    comment: CommentNode;
    level?: number;
    opUser?: string;
    onContinueConversation: (parentCommentId: string) => void;
    postId?: string;
};

const CommentChildrenComponent = ({
    childrenComments,
    level,
    opUser,
    onContinueConversation,
    postId,
}: {
    childrenComments: CommentNode[];
    level?: number;
    opUser?: string;
    onContinueConversation: (parentCommentId: string) => void;
    postId?: string;
}) => (
    <>
        {childrenComments.map((child) => (
            <CommentThread
                key={child.id}
                comment={child}
                level={level}
                opUser={opUser}
                onContinueConversation={onContinueConversation}
                postId={postId}
            />
        ))}
    </>
);

const CommentChildren = React.memo(CommentChildrenComponent);

const CommentThreadComponent = ({
    comment,
    level = 0,
    opUser,
    onContinueConversation,
    postId,
}: CommentThreadProps) => {
    const client = useApolloClient();
    const [voteCount, setVoteCount] = useState(comment.upvotes);
    const [collapsed, setCollapsed] = useState(comment.upvotes < -1);
    const [showInlineReply, setShowInlineReply] = useState(false);
    const router = useNexusRouter();
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalStartIndex, setModalStartIndex] = useState(0);

    const {
        setParentUser,
        setParentContent,
        setParentDate,
        setParentCommentId,
        setParentAttachmentUrls,
    } = useContext(CurrentCommentContext);

    const [containerWidth, setContainerWidth] = useState(0);
    const isComputer = useIsComputer();

    const urlsInContent = extractUrls(comment.content);
    const plainContent = stripHtml(comment.content);
    const isJustLink =
        urlsInContent.length === 1 && plainContent === urlsInContent[0];

    const onUpvote = () => setVoteCount((prev) => prev + 1);
    const onDownvote = () => setVoteCount((prev) => prev - 1);

    const handleImagePress = (index: number) => {
        setModalStartIndex(index);
        setModalVisible(true);
    };

    return (
        <View
            style={[
                styles.commentContainer,
                level === 0
                    ? { borderLeftWidth: 0, paddingLeft: 0 }
                    : { marginTop: Spacing.LG, paddingLeft: Spacing.MD },
            ]}
        >
            <View
                style={[
                    styles.singleComment,
                    level === 0 && { paddingLeft: Spacing.MD },
                ]}
                onLayout={(event: LayoutChangeEvent) => {
                    const { width } = event.nativeEvent.layout;
                    setContainerWidth(width);
                }}
            >
                <TouchableOpacity
                    onPress={() => setCollapsed(!collapsed)}
                    style={styles.commentHeader}
                >
                    <Icon
                        name={collapsed ? 'chevron-right' : 'chevron-down'}
                        size={12}
                        color={theme.colors.InactiveText}
                        style={styles.collapseIcon}
                    />
                    <NexusImage
                        source={`https://picsum.photos/seed/${comment.user.replaceAll(
                            /[^\dA-Za-z]/g,
                            ''
                        )}/48`}
                        alt="user picture"
                        style={styles.commentUserPic}
                        width={28}
                        height={28}
                    />
                    <Text style={styles.commentUser}>{comment.user}</Text>
                    {opUser && opUser === comment.user && (
                        <Text style={styles.opBadge}>OP</Text>
                    )}
                    <Text style={styles.commentTime}>
                        {getRelativeTime(comment.postedAt)}
                    </Text>
                    {collapsed && (
                        <Text
                            style={styles.collapsedCommentText}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {comment.content}
                        </Text>
                    )}
                </TouchableOpacity>
                {!collapsed && (
                    <>
                        <View style={styles.commentContentWrapper}>
                            {comment.content !== '' && (
                                <>
                                    {!isJustLink && (
                                        <MarkdownRenderer
                                            text={comment.content}
                                        />
                                    )}
                                    {urlsInContent.map((url, index) => (
                                        <LinkPreview
                                            key={index}
                                            url={url}
                                            containerWidth={containerWidth}
                                        />
                                    ))}
                                </>
                            )}
                            {/* Render attachment gallery if present */}
                            {comment.attachmentUrls &&
                                comment.attachmentUrls.length > 0 && (
                                    <View style={{ alignSelf: 'flex-start' }}>
                                        <AttachmentImageGallery
                                            attachmentUrls={
                                                comment.attachmentUrls
                                            }
                                            onImagePress={handleImagePress}
                                            containerWidth={containerWidth}
                                        />
                                    </View>
                                )}
                            <View style={styles.actionsRow}>
                                <ActionButton
                                    onPress={() => {
                                        if (isComputer) {
                                            // On computer, show inline comment editor
                                            setShowInlineReply(true);
                                        } else {
                                            // On mobile, navigate to dedicated comment screen
                                            setParentUser(comment.user);
                                            setParentContent(comment.content);
                                            setParentAttachmentUrls(
                                                comment.attachmentUrls ?? []
                                            );
                                            setParentDate(comment.postedAt);
                                            setParentCommentId(comment.id);
                                            router.push('create-comment');
                                        }
                                    }}
                                    tooltipText="Reply"
                                    transparent
                                    style={styles.replyIcon}
                                >
                                    <Icon
                                        name="reply"
                                        size={18}
                                        color={theme.colors.ActiveText}
                                    />
                                </ActionButton>
                                <View style={styles.voteActionsContainer}>
                                    <VoteActions
                                        voteCount={voteCount}
                                        onUpvote={onUpvote}
                                        onDownvote={onDownvote}
                                        compact
                                    />
                                </View>
                            </View>
                        </View>
                        {/* Render inline CommentEditor for computer devices */}
                        {showInlineReply && isComputer && (
                            <View style={styles.replyInputContainer}>
                                <CommentEditor
                                    postId={postId || ''}
                                    parentCommentId={comment.id}
                                    onCancel={() => setShowInlineReply(false)}
                                    onCommentCreated={() => {
                                        setShowInlineReply(false);
                                        // Refetch comments to show the newly added comment.
                                        void client.refetchQueries({
                                            include: [
                                                FETCH_POST_COMMENTS_QUERY,
                                            ],
                                        });
                                    }}
                                    editorBackgroundColor={
                                        theme.colors.SecondaryBackground
                                    }
                                    expandedByDefault
                                />
                            </View>
                        )}
                        {comment.children.length > 0 && (
                            <CommentChildren
                                childrenComments={comment.children}
                                level={level + 1}
                                opUser={opUser}
                                onContinueConversation={onContinueConversation}
                                postId={postId}
                            />
                        )}
                        {comment.hasChildren &&
                            comment.children.length === 0 && (
                                <TouchableOpacity
                                    onPress={() =>
                                        onContinueConversation(comment.id)
                                    }
                                    style={styles.continueConversationButton}
                                >
                                    <Text
                                        style={styles.continueConversationText}
                                    >
                                        Continue the conversation
                                    </Text>
                                </TouchableOpacity>
                            )}
                        {/* Render MediaDetailsModal for comment attachments */}
                        {comment.attachmentUrls &&
                            comment.attachmentUrls.length > 0 && (
                                <MediaDetailsModal
                                    visible={modalVisible}
                                    attachments={comment.attachmentUrls || []}
                                    initialIndex={modalStartIndex}
                                    onClose={() => setModalVisible(false)}
                                />
                            )}
                    </>
                )}
            </View>
        </View>
    );
};

const areCommentsEqual = (prevComment: CommentNode, nextComment: CommentNode) =>
    prevComment.id === nextComment.id &&
    prevComment.content === nextComment.content &&
    prevComment.upvotes === nextComment.upvotes &&
    prevComment.children === nextComment.children;

export const CommentThread: React.FC<CommentThreadProps> = React.memo(
    CommentThreadComponent,
    (prevProps, nextProps) =>
        areCommentsEqual(prevProps.comment, nextProps.comment)
);
