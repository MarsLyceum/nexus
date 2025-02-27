import React, {
    useState,
    useEffect,
    useRef,
    forwardRef,
    useImperativeHandle,
} from 'react';
import {
    View,
    ActivityIndicator,
    Text,
    StyleSheet,
    useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApolloClient, useQuery } from '@apollo/client';
import { FETCH_POST_COMMENTS_QUERY, FETCH_USER_QUERY } from '../queries';
import { CommentThread, CommentNode } from './CommentThread';

export type NormalizedComments = {
    byId: { [id: string]: CommentNode & { childrenIds: string[] } };
    rootIds: string[];
};

const flattenComments = (comments: CommentNode[]): CommentNode[] => {
    const flat: CommentNode[] = [];
    const traverse = (comment: CommentNode) => {
        flat.push({ ...comment, children: [] });
        comment.children?.forEach(traverse);
    };
    comments.forEach(traverse);
    return flat;
};

const buildNormalizedState = async (
    rawComments: CommentNode[],
    client: any,
    userCache: React.MutableRefObject<{ [userId: string]: string }>
): Promise<NormalizedComments> => {
    const flatComments = flattenComments(rawComments);
    const commentsWithUser = await Promise.all(
        flatComments.map(async (comment) => {
            const userId = comment.postedByUserId;
            if (!userCache.current[userId]) {
                const { data: userData } = await client.query({
                    query: FETCH_USER_QUERY,
                    variables: { userId },
                });
                userCache.current[userId] =
                    userData?.fetchUser?.username || 'Unknown';
            }
            return { ...comment, user: userCache.current[userId] };
        })
    );

    const newById: { [id: string]: CommentNode & { childrenIds: string[] } } =
        {};
    const newRootIds: string[] = [];

    commentsWithUser.forEach((comment) => {
        newById[comment.id] = { ...comment, childrenIds: [] };
    });
    commentsWithUser.forEach((comment) => {
        if (comment.parentCommentId && newById[comment.parentCommentId]) {
            newById[comment.parentCommentId].childrenIds.push(comment.id);
        } else {
            newRootIds.push(comment.id);
        }
    });
    return { byId: newById, rootIds: newRootIds };
};

const buildCommentTree = (normalized: NormalizedComments): CommentNode[] => {
    const buildTree = (id: string): CommentNode => {
        const current = normalized.byId[id];
        const children = current.childrenIds.map(buildTree);
        return { ...current, children };
    };
    return normalized.rootIds.map(buildTree);
};

type CommentsManagerProps = {
    postId: string;
    parentCommentId?: string;
};

export const CommentsManager = forwardRef<
    { checkScrollPosition: () => void },
    CommentsManagerProps
>(({ postId, parentCommentId }, ref) => {
    const client = useApolloClient();
    const [offset, setOffset] = useState(0);
    const limit = 10;
    const [normalizedComments, setNormalizedComments] =
        useState<NormalizedComments>({
            byId: {},
            rootIds: [],
        });
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const navigation = useNavigation();

    // Cache for user data so that we don't refetch usernames repeatedly.
    const userCache = useRef<{ [userId: string]: string }>({});

    const { height: windowHeight } = useWindowDimensions();

    const { data, loading, error, fetchMore } = useQuery(
        FETCH_POST_COMMENTS_QUERY,
        {
            variables: {
                postId,
                offset,
                limit,
                ...(parentCommentId ? { parentCommentId } : {}),
            },
        }
    );

    useEffect(() => {
        let cancelled = false;
        if (data && data.fetchPostComments) {
            (async () => {
                const norm = await buildNormalizedState(
                    data.fetchPostComments,
                    client,
                    userCache
                );
                if (!cancelled) {
                    setNormalizedComments(norm);
                    if (data.fetchPostComments.length < limit) {
                        setHasMore(false);
                    }
                }
            })();
        }
        return () => {
            cancelled = true;
        };
    }, [data, client, limit]);

    const loadMoreComments = () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        const newOffset = offset + limit;
        fetchMore({
            variables: {
                offset: newOffset,
                limit,
                ...(parentCommentId ? { parentCommentId } : {}),
            },
            updateQuery: (prev, { fetchMoreResult }) => {
                if (!fetchMoreResult) return prev;
                const combined = [
                    ...prev.fetchPostComments,
                    ...fetchMoreResult.fetchPostComments,
                ];
                if (fetchMoreResult.fetchPostComments.length < limit) {
                    setHasMore(false);
                }
                (async () => {
                    const norm = await buildNormalizedState(
                        combined,
                        client,
                        userCache
                    );
                    setNormalizedComments(norm);
                })();
                return { ...prev, fetchPostComments: combined };
            },
        }).finally(() => {
            setOffset(newOffset);
            setLoadingMore(false);
        });
    };

    // Sentinel ref to detect if we need to load more comments
    const sentinelRef = useRef<View>(null);
    const thresholdOffset = 500;

    // Expose the checkScrollPosition function to parent via ref.
    const checkScrollPosition = () => {
        if (sentinelRef.current) {
            sentinelRef.current.measureInWindow((x, y, width, height) => {
                if (
                    y < windowHeight + thresholdOffset &&
                    hasMore &&
                    !loadingMore
                ) {
                    loadMoreComments();
                }
            });
        }
    };

    useImperativeHandle(ref, () => ({
        checkScrollPosition,
    }));

    const handleContinueConversation = (childCommentId: string) => {
        navigation.push('PostScreen', {
            id: postId,
            parentCommentId: childCommentId,
        });
    };

    const commentTree = buildCommentTree(normalizedComments);

    if (loading && offset === 0) {
        return (
            <View style={styles.center}>
                <ActivityIndicator />
            </View>
        );
    }
    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Error: {error.message}</Text>
            </View>
        );
    }

    return (
        <View>
            {commentTree.map((comment) => (
                <CommentThread
                    key={comment.id}
                    comment={comment}
                    level={0}
                    onContinueConversation={handleContinueConversation}
                    postId={postId}
                />
            ))}
            {loadingMore && <ActivityIndicator />}
            {/* Invisible sentinel to trigger loading more when it becomes visible */}
            <View ref={sentinelRef} style={{ height: 1 }} />
        </View>
    );
});

const styles = StyleSheet.create({
    center: {
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        color: 'red',
    },
});
