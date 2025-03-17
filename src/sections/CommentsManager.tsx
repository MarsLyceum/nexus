import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useApolloClient, useQuery, ApolloClient } from '@apollo/client';
import { FlashList } from '@shopify/flash-list';
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
    comments.forEach((element) => traverse(element));
    return flat;
};

const buildNormalizedState = async (
    rawComments: CommentNode[],
    client: ApolloClient<object>,
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
                // Cache the username to avoid duplicate queries
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
        const children = current.childrenIds.map((childId) =>
            buildTree(childId)
        );
        return { ...current, children };
    };
    return normalized.rootIds.map(buildTree);
};

export type CommentsManagerProps = {
    postId: string;
    parentCommentId?: string;
};

export const CommentsManager = ({
    postId,
    parentCommentId,
}: CommentsManagerProps) => {
    const client = useApolloClient();
    const userCache = useRef<{ [userId: string]: string }>({});

    // Local state to store the flat list of comments and control pagination
    const [allComments, setAllComments] = useState<CommentNode[]>([]);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [normalizedComments, setNormalizedComments] =
        useState<NormalizedComments>({ byId: {}, rootIds: [] });
    const limit = 10; // Number of comments per API call

    const { data, loading, error, fetchMore } = useQuery(
        FETCH_POST_COMMENTS_QUERY,
        {
            variables: {
                postId,
                offset: 0,
                limit,
                ...(parentCommentId ? { parentCommentId } : {}),
            },
            notifyOnNetworkStatusChange: true,
        }
    );

    // On mount, set initial comments from the query data.
    useEffect(() => {
        if (data && data.fetchPostComments) {
            const initialComments: CommentNode[] = data.fetchPostComments;
            setAllComments(initialComments);
            setOffset(initialComments.length);
            if (initialComments.length < limit) {
                setHasMore(false);
            }
            void buildNormalizedState(initialComments, client, userCache).then(
                setNormalizedComments
            );
        }
    }, [data, client, parentCommentId]);

    // Load more comments when FlashList triggers onEndReached.
    const loadMore = async () => {
        if (!hasMore) return;
        try {
            const { data: moreData } = await fetchMore({
                variables: { offset, limit },
            });
            const newComments: CommentNode[] = moreData.fetchPostComments;
            if (newComments.length < limit) {
                setHasMore(false);
            }
            const updatedComments = [...allComments, ...newComments];
            setAllComments(updatedComments);
            setOffset(updatedComments.length);
            void buildNormalizedState(updatedComments, client, userCache).then(
                setNormalizedComments
            );
        } catch (err) {
            console.error('Error loading more comments', err);
        }
    };

    const commentTree = buildCommentTree(normalizedComments);

    if (loading && allComments.length === 0) {
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
        <FlashList
            data={commentTree}
            renderItem={({ item }) => (
                <CommentThread
                    postId={postId}
                    comment={item}
                    level={0}
                    onContinueConversation={(childCommentId: string) => {
                        // Handle navigation or additional actions here.
                    }}
                />
            )}
            keyExtractor={(item) => item.id}
            estimatedItemSize={100}
            onEndReached={loadMore}
        />
    );
};

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
