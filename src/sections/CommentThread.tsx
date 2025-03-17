// CommentThread.tsx
import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { VoteActions } from './VoteActions';
import { COLORS } from '../constants';
import { CurrentCommentContext } from '../providers';
import {
    MarkdownRenderer,
    LinkPreview,
    Tooltip,
    CommentEditor,
} from '../small-components';
import { stripHtml, extractUrls, getRelativeTime, isComputer } from '../utils';
// Import hooks for inline comment creation (used for mobile navigation)
import { useCreateComment } from '../hooks';
import { useAppSelector, RootState } from '../redux';
// NEW: Import Apollo Client hook and comments query to allow refetching comments.
import { useApolloClient } from '@apollo/client';
import { FETCH_POST_COMMENTS_QUERY } from '../queries';

const styles = StyleSheet.create({
    commentContainer: {
        borderLeftWidth: 3,
        borderLeftColor: COLORS.TextInput,
        marginBottom: 15,
    },
    singleComment: {
        backgroundColor: COLORS.PrimaryBackground,
        borderRadius: 6,
        paddingLeft: 2,
        paddingTop: 15,
        paddingBottom: 15,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    collapseIcon: {
        marginRight: 8,
    },
    commentUserPic: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginRight: 8,
    },
    commentUser: {
        color: COLORS.White,
        fontWeight: '600',
        marginRight: 6,
    },
    opBadge: {
        backgroundColor: COLORS.Primary,
        color: COLORS.White,
        fontSize: 10,
        fontWeight: 'bold',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 6,
    },
    commentTime: {
        color: COLORS.InactiveText,
        fontSize: 12,
    },
    collapsedCommentText: {
        color: COLORS.InactiveText,
        fontSize: 12,
        marginLeft: 12,
        flex: 1,
    },
    commentContentWrapper: {
        alignSelf: 'stretch',
        flex: 1,
        maxWidth: '100%',
        paddingLeft: 10,
        marginTop: 4,
    },
    commentText: {
        color: COLORS.White,
        fontSize: 14,
        lineHeight: 20,
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 8,
    },
    replyIcon: {
        marginRight: 12,
    },
    voteActionsContainer: {},
    replyInputContainer: {
        marginTop: 10,
    },
    continueConversationButton: {
        marginTop: 10,
        padding: 8,
        backgroundColor: COLORS.Primary,
        borderRadius: 4,
        alignSelf: 'center',
    },
    continueConversationText: {
        color: COLORS.White,
        fontSize: 14,
    },
});

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
    children: CommentNode[];
};

type CommentThreadProps = {
    comment: CommentNode;
    level?: number;
    opUser?: string;
    onContinueConversation: (parentCommentId: string) => void;
    postId?: string; // <-- New prop to pass the post id for inline replies
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
    // NEW: Get a reference to the Apollo Client instance for refetching queries.
    const client = useApolloClient();
    const [voteCount, setVoteCount] = useState(comment.upvotes);
    const [collapsed, setCollapsed] = useState(comment.upvotes < -1);
    const navigation = useNavigation();
    const [showInlineReply, setShowInlineReply] = useState(false); // State for inline reply editor

    // Inline comment creation hook (used for mobile navigation) and current user from Redux.
    const user = useAppSelector((state: RootState) => state.user.user);
    const { createComment, creatingComment } = useCreateComment(() => {
        // This callback is used for the mobile flow (navigating to a dedicated comment screen).
        // It is not used in the inline comment editor.
    });

    const onUpvote = () => setVoteCount((prev) => prev + 1);
    const onDownvote = () => setVoteCount((prev) => prev - 1);
    const {
        setParentUser,
        setParentContent,
        setParentDate,
        setParentCommentId,
    } = useContext(CurrentCommentContext);

    const [containerWidth, setContainerWidth] = useState(0);

    const urlsInContent = extractUrls(comment.content);
    const plainContent = stripHtml(comment.content);
    const isJustLink =
        urlsInContent.length === 1 && plainContent === urlsInContent[0];

    return (
        <View
            style={[
                styles.commentContainer,
                level === 0
                    ? { borderLeftWidth: 0, paddingLeft: 0 }
                    : { marginTop: 16, paddingLeft: 10 },
            ]}
        >
            <View
                style={[
                    styles.singleComment,
                    level === 0 && { paddingLeft: 10 },
                ]}
                onLayout={(event) => {
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
                        color={COLORS.InactiveText}
                        style={styles.collapseIcon}
                    />
                    <ExpoImage
                        source={{
                            uri: `https://picsum.photos/seed/${comment.user.replaceAll(
                                /[^\dA-Za-z]/g,
                                ''
                            )}/48`,
                        }}
                        style={styles.commentUserPic}
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
                            <View style={styles.actionsRow}>
                                <Tooltip tooltipText="Reply">
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (isComputer()) {
                                                // On computer, show inline comment editor
                                                setShowInlineReply(true);
                                            } else {
                                                // On mobile, navigate to dedicated comment screen
                                                setParentUser(comment.user);
                                                setParentContent(
                                                    comment.content
                                                );
                                                setParentDate(comment.postedAt);
                                                setParentCommentId(comment.id);
                                                navigation.navigate(
                                                    'CreateComment'
                                                );
                                            }
                                        }}
                                        style={styles.replyIcon}
                                    >
                                        <Icon
                                            name="reply"
                                            size={16}
                                            color={COLORS.White}
                                        />
                                    </TouchableOpacity>
                                </Tooltip>
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
                        {showInlineReply && isComputer() && (
                            <View style={styles.replyInputContainer}>
                                <CommentEditor
                                    postId={postId || ''}
                                    parentCommentId={comment.id}
                                    onCancel={() => setShowInlineReply(false)}
                                    onCommentCreated={() => {
                                        setShowInlineReply(false);
                                        // Refetch comments to show the newly added comment.
                                        client.refetchQueries({
                                            include: [
                                                FETCH_POST_COMMENTS_QUERY,
                                            ],
                                        });
                                    }}
                                    editorBackgroundColor={
                                        COLORS.SecondaryBackground
                                    }
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
