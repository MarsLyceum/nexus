// CommentThread.tsx
import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { VoteActions } from './VoteActions';
import { COLORS } from '../constants';
import { useAppSelector, RootState, UserType } from '../redux';
import { CurrentCommentContext } from '../providers';

// New imports for markdown and link preview logic
import { MarkdownRenderer, LinkPreview } from '../small-components';
import { stripHtml, extractUrls, getRelativeTime } from '../utils';

const styles = StyleSheet.create({
    commentContainer: {
        borderLeftWidth: 3,
        borderLeftColor: COLORS.TextInput,
        paddingLeft: 10,
        marginBottom: 15,
    },
    singleComment: {
        backgroundColor: COLORS.PrimaryBackground,
        borderRadius: 6,
        padding: 10,
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
    // New style for the OP badge
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
        alignSelf: 'flex-start',
        maxWidth: '100%',
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
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    replyInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: COLORS.InactiveText,
        borderRadius: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        fontSize: 14,
        color: COLORS.White,
    },
    sendReplyButton: {
        backgroundColor: COLORS.Primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 4,
        marginLeft: 8,
    },
    sendReplyText: {
        color: COLORS.White,
        fontSize: 14,
    },
});

export type CommentNode = {
    id: string;
    user: string;
    time: string;
    upvotes: number;
    content: string;
    children: CommentNode[];
};

type CommentThreadProps = {
    comment: CommentNode;
    level?: number;
    // New optional prop for the original poster's username
    opUser?: string;
};

export const CommentThread: React.FC<CommentThreadProps> = ({
    comment,
    level = 0,
    opUser,
}) => {
    const [voteCount, setVoteCount] = useState(comment.upvotes);
    const [collapsed, setCollapsed] = useState(comment.upvotes < -1);
    const [replyText, setReplyText] = useState('');
    const navigation = useNavigation();
    const [childReplies, setChildReplies] = useState<CommentNode[]>(
        comment.children
    );
    const user: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );

    const onUpvote = () => setVoteCount((prev) => prev + 1);
    const onDownvote = () => setVoteCount((prev) => prev - 1);
    const { setParentUser, setParentContent, setParentDate } = useContext(
        CurrentCommentContext
    );

    // Compute the inner width for link previews (similar to post item)
    const { width: windowWidth } = Dimensions.get('window');
    const commentInnerWidth = windowWidth - 30;

    // Determine if the comment content is a pure link
    const urlsInContent = extractUrls(comment.content);
    const plainContent = stripHtml(comment.content);
    const isJustLink =
        urlsInContent.length === 1 && plainContent === urlsInContent[0];

    return (
        <View
            style={[
                styles.commentContainer,
                level === 0 && { borderLeftWidth: 0, paddingLeft: 0 },
            ]}
        >
            <View style={styles.singleComment}>
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
                    {/* If the comment's user matches the original poster, show the OP badge */}
                    {opUser && opUser === comment.user && (
                        <Text style={styles.opBadge}>OP</Text>
                    )}
                    <Text style={styles.commentTime}>
                        {getRelativeTime(comment.time)}
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
                            {/* Using MarkdownRenderer and LinkPreview for comment content */}
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
                                            containerWidth={commentInnerWidth}
                                        />
                                    ))}
                                </>
                            )}
                            <View style={styles.actionsRow}>
                                <TouchableOpacity
                                    onPress={() => {
                                        setParentUser(comment.user);
                                        setParentContent(comment.content);
                                        setParentDate(comment.time);
                                        // @ts-expect-error navigation
                                        navigation.navigate('CreateComment');
                                    }}
                                    style={styles.replyIcon}
                                >
                                    <Icon
                                        name="reply"
                                        size={16}
                                        color={COLORS.White}
                                    />
                                </TouchableOpacity>
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
                        {childReplies.map((child) => (
                            // Pass the opUser prop to nested CommentThreads as well
                            <CommentThread
                                key={child.id}
                                comment={child}
                                level={level + 1}
                                opUser={opUser}
                            />
                        ))}
                    </>
                )}
            </View>
        </View>
    );
};
