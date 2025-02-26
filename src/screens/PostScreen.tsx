import React, {
    useState,
    useContext,
    useEffect,
    useCallback,
    useMemo,
    useRef,
} from 'react';
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
    safeContainer: {
        flex: 1,
        backgroundColor: COLORS.SecondaryBackground,
        paddingTop: 15,
        ...(isWeb && { height: '100vh', display: 'flex' }),
    },
    container: { flex: 1 },
    mainContainer: {
        flex: 1,
        position: 'relative',
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
        <View style={skeletonStyles.header}>
            <View style={skeletonStyles.avatar} />
            <View style={skeletonStyles.userInfo}>
                <View style={skeletonStyles.username} />
                <View style={skeletonStyles.time} />
            </View>
        </View>
        <View style={skeletonStyles.title} />
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
     Normalized Comments Setup
     ======================= */

type NormalizedComments = {
    byId: {
        [id: string]: CommentNode & { childrenIds: string[] };
    };
    rootIds: string[];
};

// Helper: flatten nested comments (drop nested children)
const flattenComments = (comments: CommentNode[]): CommentNode[] => {
    const flat: CommentNode[] = [];
    const traverse = (comment: CommentNode) => {
        flat.push({ ...comment, children: [] });
        comment.children?.forEach(traverse);
    };
    comments.forEach(traverse);
    return flat;
};

/* =======================
     Cached Tree Builder
     ======================= */

// This hook builds the comment tree from normalized state.
// It reuses cached tree nodes if the underlying normalized node hasn’t changed.
const useCommentTree = (normalized: NormalizedComments): CommentNode[] => {
    const treeCacheRef = useRef(
        new Map<
            string,
            {
                normalized: CommentNode & { childrenIds: string[] };
                treeNode: CommentNode;
            }
        >()
    );

    const buildTree = useCallback(
        (id: string, norm: NormalizedComments): CommentNode => {
            const current = norm.byId[id];
            const children = current.childrenIds.map((childId) =>
                buildTree(childId, norm)
            );
            const treeNode: CommentNode = { ...current, children };

            treeCacheRef.current.set(id, { normalized: current, treeNode });
            return treeNode;
        },
        []
    );

    return useMemo(
        () => normalized.rootIds.map((id) => buildTree(id, normalized)),
        [normalized, buildTree]
    );
};

/* =======================
     PostScreen Component
     ======================= */

export const PostScreen: React.FC<PostScreenProps> = ({
    route,
    navigation,
}) => {
    const { id, post } = route.params;
    const dispatch = useAppDispatch();
    const client = useApolloClient();

    // Load initial root comments.
    const {
        data: initialCommentsData,
        loading: initialCommentsLoading,
        error: initialCommentsError,
    } = useQuery(FETCH_POST_COMMENTS_QUERY, {
        variables: {
            postId: post ? post.id : id?.toString(),
            offset: 0,
            limit: 10,
        },
    });

    // This state triggers loading more (child) comments.
    const [
        loadMoreCommentsParentCommentId,
        setLoadMoreCommentsParentCommentId,
    ] = useState<string | null>(null);

    // Normalized comments state.
    const [normalizedComments, setNormalizedComments] =
        useState<NormalizedComments>({
            byId: {},
            rootIds: [],
        });

    // Helper to update normalized state with new comments.
    const updateNormalizedState = async (newCommentsData: CommentNode[]) => {
        const flatComments = flattenComments(newCommentsData);
        const commentsWithUser = await Promise.all(
            flatComments.map(async (comment) => {
                const { data: commentUserData } = await client.query({
                    query: FETCH_USER_QUERY,
                    variables: { userId: comment.postedByUserId },
                });
                return {
                    ...comment,
                    user: commentUserData?.fetchUser?.username || 'Unknown',
                };
            })
        );
        setNormalizedComments((prev) => {
            const newById = { ...prev.byId };
            const newRootIds = [...prev.rootIds];
            commentsWithUser.forEach((comment) => {
                const newChildrenIds =
                    comment.children && comment.children.length > 0
                        ? comment.children.map((child) => child.id)
                        : [];
                const existing = prev.byId[comment.id];
                if (existing) {
                    const sameChildren =
                        existing.childrenIds.length === newChildrenIds.length &&
                        existing.childrenIds.every(
                            (id, i) => id === newChildrenIds[i]
                        );
                    if (
                        !sameChildren ||
                        existing.content !== comment.content ||
                        existing.user !== comment.user
                    ) {
                        newById[comment.id] = {
                            ...comment,
                            childrenIds: newChildrenIds,
                        };
                    } else {
                        newById[comment.id] = existing;
                    }
                } else {
                    newById[comment.id] = {
                        ...comment,
                        childrenIds: newChildrenIds,
                    };
                }
                // **Force update the parent if a new child was added**
                if (comment.parentCommentId) {
                    const parent =
                        newById[comment.parentCommentId] ||
                        prev.byId[comment.parentCommentId];
                    if (parent && !parent.childrenIds.includes(comment.id)) {
                        const _newChildrenIds = [
                            ...parent.childrenIds,
                            comment.id,
                        ];
                        newById[comment.parentCommentId] = {
                            ...parent,
                            childrenIds: _newChildrenIds,
                        };
                    }
                } else {
                    // For root comments, add their id if not already present.
                    if (!newRootIds.includes(comment.id)) {
                        newRootIds.push(comment.id);
                    }
                }
            });

            return { byId: newById, rootIds: newRootIds };
        });
    };

    // Update normalized state with initial comments.
    useEffect(() => {
        if (initialCommentsData && initialCommentsData.fetchPostComments) {
            updateNormalizedState(initialCommentsData.fetchPostComments);
        }
    }, [initialCommentsData]);

    // When loadMoreCommentsParentCommentId is set, fetch additional comments.
    useEffect(() => {
        if (loadMoreCommentsParentCommentId) {
            client
                .query({
                    query: FETCH_POST_COMMENTS_QUERY,
                    variables: {
                        postId: post ? post.id : id?.toString(),
                        offset: 0,
                        limit: 10,
                        parentCommentId: loadMoreCommentsParentCommentId,
                    },
                    fetchPolicy: 'network-only',
                })
                .then((result) => {
                    if (result.data && result.data.fetchPostComments) {
                        updateNormalizedState(result.data.fetchPostComments);
                    }
                    setLoadMoreCommentsParentCommentId(null);
                })
                .catch((err) => {
                    console.error('Load more error:', err);
                    setLoadMoreCommentsParentCommentId(null);
                });
        }
    }, [loadMoreCommentsParentCommentId, client, id, post]);

    // Handle load more: defined here so it can be passed to CommentThread.
    const handleLoadMore = useCallback((parentCommentId: string) => {
        setLoadMoreCommentsParentCommentId(parentCommentId);
    }, []);

    // Post and user queries.
    const { data, loading, error } = useQuery(FETCH_POST_QUERY, {
        variables: { postId: post ? post.id : id?.toString() },
        skip: !!post,
    });

    const computedUserId =
        post?.postedByUserId ||
        post?.user ||
        data?.fetchPost?.postedByUserId ||
        data?.fetchPost?.user ||
        '';

    const { data: userData } = useQuery(FETCH_USER_QUERY, {
        variables: { userId: computedUserId },
        skip: computedUserId === '',
    });

    const feedPost: Post | undefined = post || data?.fetchPost;
    const rawTime = feedPost?.postedAt || feedPost?.time || '';
    const formattedTime = rawTime ? getRelativeTime(rawTime) : 'Unknown time';
    const resolvedUsername = userData?.fetchUser?.username || 'Username';

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
        if (postData?.id) setPostId(postData.id);
        if (postData?.user) setParentUser(postData.user);
        if (postData?.content) setParentContent(postData.content);
        if (feedPost?.postedAt) setParentDate(feedPost.postedAt);
    }, [postData?.id, postData?.user, postData?.content, feedPost?.postedAt]);

    // Build the comment tree using our cache-aware hook.
    const commentTree: CommentNode[] = useCommentTree(normalizedComments);

    if (loading) {
        return (
            <SafeAreaView style={styles.safeContainer}>
                <View style={styles.mainContainer}>
                    <ScrollView
                        style={styles.scrollSection}
                        contentContainerStyle={styles.scrollView}
                        keyboardShouldPersistTaps="handled"
                    >
                        <SkeletonPostItem />
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
        <SafeAreaView style={styles.safeContainer}>
            <ContainerComponent {...containerProps}>
                <View style={styles.mainContainer}>
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
                                    navigation.navigate('AppDrawer');
                                }
                            }}
                            fromReddit={Math.random() < 0.2}
                            variant="details"
                            group="My cool group"
                        />
                        {initialCommentsLoading ? (
                            <>
                                <SkeletonComment />
                                <SkeletonComment />
                                <SkeletonComment />
                            </>
                        ) : (
                            commentTree.map((c) => (
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
                    <View style={styles.createContentButtonContainer}>
                        <CreateContentButton
                            buttonText="Write a comment..."
                            onPress={() => navigation.navigate('CreateComment')}
                        />
                    </View>
                </View>
            </ContainerComponent>
        </SafeAreaView>
    );
};
