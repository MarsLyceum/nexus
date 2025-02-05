// PostScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    ScrollView,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { PostItem, VoteActions } from '../sections';
import { COLORS } from '../constants';

/**
 * Define the RootStackParamList locally.
 */
type RootStackParamList = {
    PostScreen: { post: any };
};

type PostScreenProps = {
    navigation: NavigationProp<RootStackParamList, 'PostScreen'>;
    route: RouteProp<RootStackParamList, 'PostScreen'>;
};

/** --------------- DATA MODELS --------------- **/
type PostData = {
    subreddit: string;
    user: string;
    time: string;
    title: string;
    flair: string;
    upvotes: number;
    commentsCount: number;
};

type CommentNode = {
    id: string;
    user: string;
    time: string;
    upvotes: number;
    content: string;
    children: CommentNode[];
};

/** --------------- STYLES --------------- **/
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.PrimaryBackground,
    },
    scrollContent: {
        padding: 15,
    },
    // Styles for comments
    commentContainer: {
        borderLeftWidth: 3,
        borderLeftColor: COLORS.Primary,
        paddingLeft: 10,
        marginBottom: 15,
    },
    singleComment: {
        backgroundColor: COLORS.SecondaryBackground,
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
    commentTime: {
        color: COLORS.InactiveText,
        fontSize: 12,
    },
    commentText: {
        color: COLORS.White,
        fontSize: 14,
        lineHeight: 20,
    },
    // Style for collapsed comment snippet (displayed inline with name and time)
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

/** --------------- COMMENT THREAD --------------- **/
type CommentThreadProps = {
    comment: CommentNode;
    level?: number;
};

const CommentThread: React.FC<CommentThreadProps> = ({
    comment,
    level = 0,
}) => {
    const [voteCount, setVoteCount] = useState(comment.upvotes);
    const [collapsed, setCollapsed] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [childReplies, setChildReplies] = useState<CommentNode[]>(
        comment.children
    );

    const onUpvote = () => setVoteCount((prev) => prev + 1);
    const onDownvote = () => setVoteCount((prev) => prev - 1);

    const handleSubmitReply = () => {
        if (replyText.trim() !== '') {
            const newReply: CommentNode = {
                id: `reply-${Date.now()}`,
                user: 'currentUser',
                time: 'Just now',
                upvotes: 0,
                content: replyText,
                children: [],
            };
            setChildReplies([...childReplies, newReply]);
            setReplyText('');
            setIsReplying(false);
        }
    };

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
                    <Image
                        source={{
                            uri: `https://picsum.photos/seed/${comment.user.replace(
                                /[^a-zA-Z0-9]/g,
                                ''
                            )}/48`,
                        }}
                        style={styles.commentUserPic}
                    />
                    <Text style={styles.commentUser}>{comment.user}</Text>
                    <Text style={styles.commentTime}>{comment.time}</Text>
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
                            {/* When expanded, show the full comment content below the header */}
                            <TouchableOpacity
                                onPress={() => setCollapsed(!collapsed)}
                            >
                                <Text style={styles.commentText}>
                                    {comment.content}
                                </Text>
                            </TouchableOpacity>
                            <View style={styles.actionsRow}>
                                <TouchableOpacity
                                    onPress={() => setIsReplying(true)}
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
                            {isReplying && (
                                <View style={styles.replyInputContainer}>
                                    <TextInput
                                        style={styles.replyInput}
                                        value={replyText}
                                        onChangeText={setReplyText}
                                        placeholder="Write a reply..."
                                        placeholderTextColor={
                                            COLORS.InactiveText
                                        }
                                    />
                                    <TouchableOpacity
                                        onPress={handleSubmitReply}
                                        style={styles.sendReplyButton}
                                    >
                                        <Text style={styles.sendReplyText}>
                                            Send
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                        {childReplies.map((child) => (
                            <CommentThread
                                key={child.id}
                                comment={child}
                                level={level + 1}
                            />
                        ))}
                    </>
                )}
            </View>
        </View>
    );
};

/** --------------- MAIN POST SCREEN --------------- **/
export const PostScreen: React.FC<PostScreenProps> = ({
    route,
    navigation,
}) => {
    const { post: feedPost } = route.params;
    // Create a PostData object for demonstration.
    const postData: PostData = {
        subreddit: 'r/pcgaming',
        user: feedPost.user,
        time: feedPost.time,
        title: feedPost.title,
        flair: '', // assuming no flair data from the feed
        upvotes: feedPost.upvotes,
        commentsCount: feedPost.commentsCount,
    };

    // Sample comments (replace with real data as needed)
    const comments: CommentNode[] = [
        {
            id: 'comment-1',
            user: 'myersthekid',
            time: '6h',
            upvotes: 107,
            content:
                "I hear people all the time say they've done a 360 in their life instead of a 180. Haha",
            children: [
                {
                    id: 'comment-2',
                    user: 'FrostySand8997',
                    time: '5h',
                    upvotes: 30,
                    content:
                        'This trashy girl once told me and my wife that she did a 380. We still laugh about her dumb ass 20 years later... so u spun around all the way plus a little bit?',
                    children: [
                        {
                            id: 'comment-3',
                            user: 'myersthekid',
                            time: '5h',
                            upvotes: 12,
                            content:
                                'Okay, but a 380 is actually super impressive hahaha',
                            children: [],
                        },
                    ],
                },
            ],
        },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <PostItem
                    user={postData.user}
                    time={postData.time}
                    title={postData.title}
                    upvotes={postData.upvotes}
                    commentsCount={postData.commentsCount}
                    flair={postData.flair}
                    onBackPress={() => navigation.goBack()}
                />
                {comments.map((c) => (
                    <CommentThread key={c.id} comment={c} level={0} />
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};
