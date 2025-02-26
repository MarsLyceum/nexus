import React, {
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef,
} from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useApolloClient, useQuery } from '@apollo/client';
import { FETCH_POST_COMMENTS_QUERY, FETCH_USER_QUERY } from '../queries';
import { CommentThread, CommentNode } from './CommentThread';
import { SkeletonComment } from '../small-components';

type NormalizedComments = {
    byId: { [id: string]: CommentNode & { childrenIds: string[] } };
    rootIds: string[];
};

// Helper: flatten nested comments (drop nested children)
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
    // State to trigger load-more for child comments.
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
                    newById[comment.id] =
                        !sameChildren ||
                        existing.content !== comment.content ||
                        existing.user !== comment.user
                            ? {
                                  ...comment,
                                  childrenIds: newChildrenIds,
                              }
                            : existing;
                } else {
                    newById[comment.id] = {
                        ...comment,
                        childrenIds: newChildrenIds,
                    };
                }
                // For child comments, update parent's childrenIds.
                if (comment.parentCommentId) {
                    const parent =
                        newById[comment.parentCommentId] ||
                        prev.byId[comment.parentCommentId];
                    if (parent && !parent.childrenIds.includes(comment.id)) {
                        // eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
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

    // Load more comments when triggered.
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
                        updateNormalizedState(result.data.fetchPostComments);
                    }
                    setLoadMoreCommentsParentCommentId(null);
                })
                .catch((err) => {
                    console.error('Load more error:', err);
                    setLoadMoreCommentsParentCommentId(null);
                });
        }
    }, [loadMoreCommentsParentCommentId, client, postId]);

    // Callback to trigger load more.
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
                    onLoadMore={handleLoadMore}
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
