import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Text,
} from 'react-native';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { useQuery, useApolloClient } from '@apollo/client';
import { useAppDispatch, loadUser } from '../redux';
import {
    FETCH_POST_QUERY,
    FETCH_USER_QUERY,
    FETCH_POST_COMMENTS_QUERY,
} from '../queries';
import { PostItem, CommentThread, CommentNode } from '../sections';
import { COLORS } from '../constants';
import { CreateContentButton } from '../buttons';
import { getRelativeTime } from '../utils';
import { Post, PostData } from '../types';
import { CurrentCommentContext } from '../providers';

type RootStackParamList = {
    PostScreen: { id?: number; post?: Post };
};

type PostScreenProps = {
    navigation: NavigationProp<RootStackParamList, 'PostScreen'>;
    route: RouteProp<RootStackParamList, 'PostScreen'>;
};

const BOTTOM_INPUT_HEIGHT = 60;
const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
    // @ts-expect-error web only type
    safeContainer: {
        flex: 1,
        backgroundColor: COLORS.SecondaryBackground,
        paddingTop: 15,
        ...(isWeb && { height: '100vh', display: 'flex' }),
    },
    container: {
        flex: 1,
    },
    mainContainer: {
        flex: 1,
        position: 'relative', // Added to allow absolute positioning of the button
    },
    scrollSection: isWeb
        ? {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: BOTTOM_INPUT_HEIGHT,
              overflowY: 'auto',
          }
        : { flex: 1 },
    scrollView: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    // New style for the CreateContentButton container
    createContentButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: BOTTOM_INPUT_HEIGHT,
    },
});

/* =======================
   Skeleton Components
   ======================= */

const SkeletonPostItem: React.FC = () => (
    <View style={skeletonStyles.container}>
        {/* Header with avatar and user info */}
        <View style={skeletonStyles.header}>
            <View style={skeletonStyles.avatar} />
            <View style={skeletonStyles.userInfo}>
                <View style={skeletonStyles.username} />
                <View style={skeletonStyles.time} />
            </View>
        </View>
        {/* Title */}
        <View style={skeletonStyles.title} />
        {/* Content lines */}
        <View style={skeletonStyles.contentLine} />
        <View style={[skeletonStyles.contentLine, { width: '80%' }]} />
        <View style={[skeletonStyles.contentLine, { width: '90%' }]} />
    </View>
);

const skeletonStyles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.PrimaryBackground,
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.InactiveText,
    },
    userInfo: {
        marginLeft: 10,
        flex: 1,
    },
    username: {
        width: '50%',
        height: 10,
        backgroundColor: COLORS.InactiveText,
        borderRadius: 5,
        marginBottom: 5,
    },
    time: {
        width: '30%',
        height: 10,
        backgroundColor: COLORS.InactiveText,
        borderRadius: 5,
    },
    title: {
        width: '80%',
        height: 20,
        backgroundColor: COLORS.InactiveText,
        borderRadius: 5,
        marginBottom: 10,
    },
    contentLine: {
        width: '100%',
        height: 10,
        backgroundColor: COLORS.InactiveText,
        borderRadius: 5,
        marginBottom: 5,
    },
});

const SkeletonComment: React.FC = () => (
    <View style={skeletonCommentStyles.container}>
        <View style={skeletonCommentStyles.avatar} />
        <View style={skeletonCommentStyles.content}>
            <View style={skeletonCommentStyles.line} />
            <View style={[skeletonCommentStyles.line, { width: '80%' }]} />
        </View>
    </View>
);

const skeletonCommentStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: COLORS.InactiveText,
    },
    content: {
        flex: 1,
        marginLeft: 10,
    },
    line: {
        height: 10,
        backgroundColor: COLORS.InactiveText,
        borderRadius: 5,
        marginBottom: 5,
    },
});

/* =======================
   PostScreen Component
   ======================= */

export const PostScreen: React.FC<PostScreenProps> = ({
    route,
    navigation,
}) => {
    // Destructure the post (if available) and the id from the route params.
    const { id, post } = route.params;
    const [
        loadMoreCommentsParentCommentId,
        setLoadMoreCommentsParentCommentId,
    ] = useState<string | null>(null);

    // Fetch the post if it wasn’t passed in via navigation.
    const { data, loading, error } = useQuery(FETCH_POST_QUERY, {
        variables: {
            postId: post ? post.id : id?.toString(),
        },
        skip: !!post, // skip if a post was already passed in
    });

    const {
        data: commentsData,
        loading: commentsLoading,
        error: commentsError,
    } = useQuery(FETCH_POST_COMMENTS_QUERY, {
        variables: {
            postId: post ? post.id : id?.toString(),
            offset: 0,
            limit: 10,
            parentCommentId: loadMoreCommentsParentCommentId,
        },
    });
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(loadUser());
    }, [dispatch]);

    // Compute the user id from the passed post or fetched post.
    const computedUserId =
        post?.postedByUserId ||
        post?.user ||
        data?.fetchPost?.postedByUserId ||
        data?.fetchPost?.user ||
        '';

    // Fetch user details based on the computed user id.
    const { data: userData } = useQuery(FETCH_USER_QUERY, {
        variables: { userId: computedUserId },
        skip: computedUserId === '',
    });

    // Use the provided post if available; otherwise, use the fetched post.
    const feedPost: Post | undefined = post || data?.fetchPost;

    // Format the time using our utility function.
    const rawTime = feedPost?.postedAt || feedPost?.time || '';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const formattedTime = rawTime ? getRelativeTime(rawTime) : 'Unknown time';

    // Resolve the username from the fetched user data.
    const resolvedUsername = userData?.fetchUser?.username || 'Username';

    // Map the post fields into our local PostData type.
    const postData: PostData = {
        id: feedPost?.id ?? '',
        user: resolvedUsername,
        time: formattedTime,
        title: feedPost?.title ?? '',
        flair: feedPost?.flair || '',
        upvotes: feedPost?.upvotes ?? 0,
        commentsCount: feedPost?.commentsCount ?? 0,
        content: feedPost?.content ?? '',
        attachmentUrls: feedPost?.attachmentUrls || [],
    };
    const { setParentUser, setParentContent, setParentDate, setPostId } =
        useContext(CurrentCommentContext);

    useEffect(() => {
        if (postData?.id) {
            setPostId(postData.id);
        }
        if (postData?.user) {
            setParentUser(postData.user);
        }
        if (postData?.content) {
            setParentContent(postData.content);
        }
        if (feedPost?.postedAt) {
            setParentDate(feedPost.postedAt);
        }
    }, [postData?.id, postData?.user, postData?.content, feedPost?.postedAt]);

    // Always call these state hooks.
    const [comments, setComments] = useState<CommentNode[]>([]);
    const handleLoadMore = useCallback((parentCommentId: string) => {
        setLoadMoreCommentsParentCommentId(parentCommentId);
    }, []);

    const client = useApolloClient();

    useEffect(() => {
        const updateComments = async () => {
            async function fetchUsersForComments(newComments: CommentNode[]) {
                if (newComments) {
                    // Helper function that fetches user for a comment and its nested comments recursively.
                    // eslint-disable-next-line no-inner-declarations
                    const fetchUserForComment = async (
                        comment: any
                    ): Promise<any> => {
                        // Fetch the user details for this comment.
                        const { data: commentUserData } = await client.query({
                            query: FETCH_USER_QUERY,
                            variables: {
                                userId: comment.postedByUserId,
                            },
                        });

                        // Check if there are nested comments and process them recursively.
                        let childrenWithUsers = [];
                        if (comment.children && comment.children.length > 0) {
                            childrenWithUsers = await Promise.all(
                                comment.children.map((nestedComment: any) =>
                                    fetchUserForComment(nestedComment)
                                )
                            );
                        }

                        // Return the comment with the fetched username and processed nested comments.
                        return {
                            ...comment,
                            user:
                                commentUserData?.fetchUser?.username ||
                                'Unknown',
                            // Replace the nestedComments with the processed ones.
                            children: childrenWithUsers,
                        };
                    };

                    // Process all top-level comments recursively.
                    const commentsWithUser = await Promise.all(
                        newComments.map((comment: any) =>
                            fetchUserForComment(comment)
                        )
                    );
                    return commentsWithUser;
                }
            }

            const insertCommentRecursive = (
                comments: CommentNode[],
                newComment: CommentNode
            ): CommentNode[] => {
                // If no comments, simply return an array with the new comment.
                if (comments.length === 0) return [newComment];

                return comments.map((comment) => {
                    // Check if this comment is the target parent.
                    if (comment.id === newComment.parentCommentId) {
                        // Create a new object for this branch with updated children.
                        return {
                            ...comment,
                            children: comment.children
                                ? [...comment.children, newComment]
                                : [newComment],
                        };
                    }
                    // If there are children, recursively update.
                    if (comment.children && comment.children.length > 0) {
                        const updatedChildren = insertCommentRecursive(
                            comment.children,
                            newComment
                        );
                        // If children have changed, return a new comment object; otherwise return the same comment.
                        if (updatedChildren !== comment.children) {
                            return { ...comment, children: updatedChildren };
                        }
                    }
                    return comment; // unchanged branch
                });
            };

            if (commentsData) {
                // Determine the accumulator: if we're loading more, use the current state; otherwise, start fresh.
                const accumulator = loadMoreCommentsParentCommentId
                    ? comments
                    : [];
                const newComments = commentsData.fetchPostComments.reduce(
                    (acc, newComment) =>
                        insertCommentRecursive(acc, newComment),
                    accumulator
                );
                const updatedCommentsWithUsers =
                    await fetchUsersForComments(newComments);
                setComments(updatedCommentsWithUsers);
            }
        };
        void updateComments();
    }, [commentsData, client]);

    // If the post query is still loading, render the skeleton screen.
    if (loading) {
        return (
            // @ts-expect-error web only types
            <SafeAreaView style={styles.safeContainer}>
                {/* @ts-expect-error web only types */}
                <View style={styles.mainContainer}>
                    {/* @ts-expect-error web only types */}
                    <ScrollView
                        style={styles.scrollSection}
                        contentContainerStyle={styles.scrollView}
                        keyboardShouldPersistTaps="handled"
                    >
                        <SkeletonPostItem />
                        {/* Render a few skeleton comment placeholders */}
                        <SkeletonComment />
                        <SkeletonComment />
                        <SkeletonComment />
                    </ScrollView>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            // @ts-expect-error web only types
            <SafeAreaView style={styles.safeContainer}>
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Text>Error loading post: {error.message}</Text>
                </View>
            </SafeAreaView>
        );
    }

    const ContainerComponent = isWeb ? View : KeyboardAvoidingView;
    const containerProps = isWeb
        ? { style: styles.container }
        : {
              style: styles.container,
              behavior: Platform.OS === 'ios' ? 'padding' : undefined,
          };

    return (
        // @ts-expect-error web only types
        <SafeAreaView style={styles.safeContainer}>
            {/* @ts-expect-error props */}
            <ContainerComponent {...containerProps}>
                {/* @ts-expect-error web only types */}
                <View style={styles.mainContainer}>
                    {/* @ts-expect-error web only types */}
                    <ScrollView
                        style={styles.scrollSection}
                        contentContainerStyle={styles.scrollView}
                        keyboardShouldPersistTaps="handled"
                    >
                        <PostItem
                            id={postData.id}
                            username={postData.user}
                            time={postData.time}
                            title={postData.title}
                            content={postData.content}
                            upvotes={postData.upvotes}
                            commentsCount={postData.commentsCount}
                            flair={postData.flair}
                            attachmentUrls={postData.attachmentUrls}
                            onBackPress={() => {
                                if (navigation.canGoBack()) {
                                    navigation.goBack();
                                } else {
                                    // @ts-expect-error navigation
                                    navigation.navigate('AppDrawer');
                                }
                            }}
                            fromReddit={Math.random() < 0.2}
                            variant="details"
                            group="My cool group"
                        />
                        {commentsLoading ? (
                            <>
                                <SkeletonComment />
                                <SkeletonComment />
                                <SkeletonComment />
                            </>
                        ) : (
                            comments.map((c) => (
                                <CommentThread
                                    key={c.id}
                                    comment={c}
                                    level={0}
                                    opUser={postData.user}
                                    onLoadMore={handleLoadMore}
                                />
                            ))
                        )}
                    </ScrollView>
                    {/* Fixed CreateContentButton at the bottom */}
                    {/* @ts-expect-error web only types */}
                    <View style={styles.createContentButtonContainer}>
                        <CreateContentButton
                            buttonText="Write a comment..."
                            // @ts-expect-error navigation
                            onPress={() => navigation.navigate('CreateComment')}
                        />
                    </View>
                </View>
            </ContainerComponent>
        </SafeAreaView>
    );
};
