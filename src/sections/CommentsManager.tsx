import React, { useState, useEffect, useRef } from 'react';
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

export type CommentsManagerProps = {
    postId: string;
    parentCommentId?: string;
    // scrollY is the current vertical scroll offset from the parent ScrollView.
    scrollY: number;
};

export const CommentsManager = ({
    postId,
    parentCommentId,
    scrollY,
}: CommentsManagerProps) => {
    const client = useApolloClient();
    const navigation = useNavigation();
    const { height: windowHeight } = useWindowDimensions();

    // Configuration values
    const limit = 10; // comments per API call
    const WINDOW_SIZE = 50; // max number of comments in our window
    const upperThreshold = 100; // trigger upward load when scrollY is less than this
    const lowerThreshold = 400; // trigger downward load when scrollY is near bottom

    // Window state: windowStartOffset is the index (in overall order) of the first comment in the window.
    // windowEndOffset is the index after the last comment in the window.
    const [windowStartOffset, setWindowStartOffset] = useState(0);
    const [windowEndOffset, setWindowEndOffset] = useState(0);
    const [commentsWindow, setCommentsWindow] = useState<CommentNode[]>([]);
    const [hasMoreDown, setHasMoreDown] = useState(true);
    const [hasMoreUp, setHasMoreUp] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [normalizedComments, setNormalizedComments] =
        useState<NormalizedComments>({ byId: {}, rootIds: [] });

    const userCache = useRef<{ [userId: string]: string }>({});

    // Initial fetch: get first page.
    const { data, loading, error } = useQuery(FETCH_POST_COMMENTS_QUERY, {
        variables: {
            postId,
            offset: 0,
            limit,
            ...(parentCommentId ? { parentCommentId } : {}),
        },
        notifyOnNetworkStatusChange: true,
    });

    // On initial load, set up the window.
    useEffect(() => {
        if (data && data.fetchPostComments) {
            const initialComments: CommentNode[] = data.fetchPostComments;
            setCommentsWindow(initialComments);
            setWindowStartOffset(0);
            setWindowEndOffset(initialComments.length);
            setHasMoreDown(initialComments.length === limit);
            setHasMoreUp(false);
            buildNormalizedState(initialComments, client, userCache).then(
                setNormalizedComments
            );
        }
    }, [data, client, limit]);

    // Helper: update normalized state.
    const updateNormalizedState = async (rawComments: CommentNode[]) => {
        const norm = await buildNormalizedState(rawComments, client, userCache);
        setNormalizedComments(norm);
    };

    // Downward load: fetch older comments.
    const loadNextPage = async () => {
        if (loadingMore || !hasMoreDown) return;
        setLoadingMore(true);
        try {
            const offset = windowEndOffset;
            const { data: moreData } = await client.query({
                query: FETCH_POST_COMMENTS_QUERY,
                variables: {
                    postId,
                    offset,
                    limit,
                    ...(parentCommentId ? { parentCommentId } : {}),
                },
            });
            const newComments: CommentNode[] = moreData.fetchPostComments;
            if (newComments.length < limit) {
                setHasMoreDown(false);
            }
            const existingIds = new Set(commentsWindow.map((c) => c.id));
            const filteredNew = newComments.filter(
                (c) => !existingIds.has(c.id)
            );
            let newWindow = [...commentsWindow, ...filteredNew];
            if (newWindow.length > WINDOW_SIZE) {
                const excess = newWindow.length - WINDOW_SIZE;
                newWindow = newWindow.slice(excess);
                setWindowStartOffset(windowStartOffset + excess);
            }
            setCommentsWindow(newWindow);
            setWindowEndOffset(windowEndOffset + filteredNew.length);
            if (windowStartOffset > 0) setHasMoreUp(true);
            await updateNormalizedState(newWindow);
        } catch (err) {
            console.error('Error loading next page', err);
        } finally {
            setLoadingMore(false);
        }
    };

    // Upward load: fetch newer comments.
    const loadPrevPage = async () => {
        if (loadingMore || !hasMoreUp) return;
        setLoadingMore(true);
        try {
            const newOffset = Math.max(windowStartOffset - limit, 0);
            const { data: moreData } = await client.query({
                query: FETCH_POST_COMMENTS_QUERY,
                variables: {
                    postId,
                    offset: newOffset,
                    limit,
                    ...(parentCommentId ? { parentCommentId } : {}),
                },
            });
            const newComments: CommentNode[] = moreData.fetchPostComments;
            if (newOffset === 0 || newComments.length < limit) {
                setHasMoreUp(false);
            }
            const existingIds = new Set(commentsWindow.map((c) => c.id));
            const filteredNew = newComments.filter(
                (c) => !existingIds.has(c.id)
            );
            let newWindow = [...filteredNew, ...commentsWindow];
            if (newWindow.length > WINDOW_SIZE) {
                newWindow = newWindow.slice(0, WINDOW_SIZE);
            }
            setCommentsWindow(newWindow);
            setWindowStartOffset(newOffset);
            setWindowEndOffset(newOffset + newWindow.length);
            if (filteredNew.length === limit) setHasMoreDown(true);
            await updateNormalizedState(newWindow);
        } catch (err) {
            console.error('Error loading previous page', err);
        } finally {
            setLoadingMore(false);
        }
    };

    // Use parent's scrollY prop to decide when to load more comments.
    // We assume that scrollY represents the vertical offset (in pixels) of the parent scroll view.
    useEffect(() => {
        // When near the top, try loading newer comments.
        if (scrollY < upperThreshold && windowStartOffset > 0 && !loadingMore) {
            loadPrevPage();
        }
        // When near the bottom, try loading older comments.
        if (
            scrollY > windowHeight - lowerThreshold &&
            hasMoreDown &&
            !loadingMore
        ) {
            loadNextPage();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scrollY, windowHeight, loadingMore, windowStartOffset, hasMoreDown]);

    const handleContinueConversation = (childCommentId: string) => {
        navigation.push('PostScreen', {
            id: postId,
            parentCommentId: childCommentId,
        });
    };

    if (loading && windowEndOffset === 0) {
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

    const commentTree = buildCommentTree(normalizedComments);

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
        </View>
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
