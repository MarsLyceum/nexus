import React, {
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef,
} from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useApolloClient, useQuery } from '@apollo/client';
import { useNavigation } from '@react-navigation/native';
import { FETCH_POST_COMMENTS_QUERY, FETCH_USER_QUERY } from '../queries';
import { CommentThread, CommentNode } from './CommentThread';
import { SkeletonComment } from '../small-components';

type NormalizedComments = {
    byId: { [id: string]: CommentNode & { childrenIds: string[] } };
    rootIds: string[];
};

// Helper: flatten nested comments (drops nested children)
const flattenComments = (comments: CommentNode[]): CommentNode[] => {
    const flat: CommentNode[] = [];
    const traverse = (comment: CommentNode) => {
        flat.push({ ...comment, children: [] });
        comment.children?.forEach(traverse);
    };
    comments.forEach((element) => {
        traverse(element);
    });
    return flat;
};

// Cached tree builder hook
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

type CommentsManagerProps = {
    postId: string;
};

export const CommentsManager: React.FC<CommentsManagerProps> = ({ postId }) => {
    const client = useApolloClient();

    // Normalized comments state.
    const [normalizedComments, setNormalizedComments] =
        useState<NormalizedComments>({
            byId: {},
            rootIds: [],
        });
    const [commentHistory, setCommentHistory] = useState<NormalizedComments[]>(
        []
    );
    const navigation = useNavigation();

    const handleBack = useCallback(() => {
        setCommentHistory((prevHistory) => {
            if (prevHistory.length === 0) return prevHistory; // No history to go back to.
            const newHistory = [...prevHistory];
            const previousState = newHistory.pop();
            if (previousState) {
                setNormalizedComments(previousState);
            }
            return newHistory;
        });
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            // If we have history, intercept the back event
            if (commentHistory.length > 0) {
                e.preventDefault(); // Prevent default navigation
                handleBack();
            }
            // If no history, allow navigation to continue normally.
        });
        return unsubscribe;
    }, [navigation, commentHistory, handleBack]);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.addEventListener) {
            const onPopState = (e: PopStateEvent) => {
                if (commentHistory.length > 0) {
                    // Cancel default behavior by pushing a new state.
                    window.history.pushState(null, '', window.location.href);
                    handleBack();
                }
            };

            window.addEventListener('popstate', onPopState);
            return () => {
                window.removeEventListener('popstate', onPopState);
            };
        }
    }, [commentHistory, handleBack]);

    // State to trigger load-more (continue conversation) for child comments.
    const [
        loadMoreCommentsParentCommentId,
        setLoadMoreCommentsParentCommentId,
    ] = useState<string | null>(null);

    // Initial comments query.
    const {
        data: initialCommentsData,
        loading: initialCommentsLoading,
        error: initialCommentsError,
    } = useQuery(FETCH_POST_COMMENTS_QUERY, {
        variables: { postId, offset: 0, limit: 10 },
    });

    // Helper: update full normalized state for initial load or full replacement.
    const updateFullNormalizedState = async (
        newCommentsData: CommentNode[]
    ) => {
        setCommentHistory((prevHistory) => {
            // Assuming normalizedComments is accessible in this scope.
            // Only push if there's data in the current state.
            if (Object.keys(normalizedComments.byId).length > 0) {
                return [...prevHistory, normalizedComments];
            }
            return prevHistory;
        });

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
        // Build normalized state from scratch.
        const newById: {
            [id: string]: CommentNode & { childrenIds: string[] };
        } = {};
        const newRootIds: string[] = [];
        // First pass: create entries for every comment.
        commentsWithUser.forEach((comment) => {
            newById[comment.id] = { ...comment, childrenIds: [] };
        });
        // Second pass: assign childrenIds or mark as root.
        commentsWithUser.forEach((comment) => {
            if (comment.parentCommentId && newById[comment.parentCommentId]) {
                newById[comment.parentCommentId].childrenIds.push(comment.id);
            } else {
                newRootIds.push(comment.id);
            }
        });
        setNormalizedComments({ byId: newById, rootIds: newRootIds });

        if (
            typeof window !== 'undefined' &&
            window.history &&
            window.history.pushState
        ) {
            window.history.pushState(
                { comments: { byId: newById, rootIds: newRootIds } },
                ''
            );
        }
    };

    // Update normalized state with initial comments.
    useEffect(() => {
        if (initialCommentsData && initialCommentsData.fetchPostComments) {
            updateFullNormalizedState(initialCommentsData.fetchPostComments);
        }
    }, [initialCommentsData]);

    // Load more comments (continue conversation) when triggered.
    useEffect(() => {
        if (loadMoreCommentsParentCommentId) {
            client
                .query({
                    query: FETCH_POST_COMMENTS_QUERY,
                    variables: {
                        postId,
                        offset: 0,
                        limit: 10,
                        parentCommentId: loadMoreCommentsParentCommentId,
                    },
                })
                .then((result) => {
                    if (result.data && result.data.fetchPostComments) {
                        // Replace the entire normalized state with the new tree.
                        updateFullNormalizedState(
                            result.data.fetchPostComments
                        );
                    }
                    setLoadMoreCommentsParentCommentId(null);
                })
                .catch((err) => {
                    console.error('Load more error:', err);
                    setLoadMoreCommentsParentCommentId(null);
                });
        }
    }, [loadMoreCommentsParentCommentId, client, postId]);

    // Callback to trigger load more (continue conversation).
    const handleLoadMore = useCallback((parentCommentId: string) => {
        setLoadMoreCommentsParentCommentId(parentCommentId);
    }, []);

    // Build comment tree.
    const commentTree: CommentNode[] = useCommentTree(normalizedComments);

    if (initialCommentsLoading) {
        return (
            <>
                <SkeletonComment />
                <SkeletonComment />
                <SkeletonComment />
            </>
        );
    }

    if (initialCommentsError) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                    Error loading comments: {initialCommentsError.message}
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {commentTree.map((c) => (
                <CommentThread
                    key={c.id}
                    comment={c}
                    level={0}
                    onContinueConversation={handleLoadMore}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10,
    },
    errorContainer: {
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        color: 'red',
    },
});
