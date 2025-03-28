import React, {
    useEffect,
    useContext,
    useRef,
    useState,
    useCallback,
} from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'solito/router';
import { useApolloClient } from '@apollo/client';
import type { GetServerSideProps } from 'next';

import { useAppDispatch, loadUser } from '@shared-ui/redux';
import {
    FETCH_POST_QUERY,
    FETCH_USER_QUERY,
    FETCH_POST_COMMENTS_QUERY,
} from '@shared-ui/queries';
import { PostItem, CommentsManager } from '@shared-ui/sections';
import { COLORS } from '@shared-ui/constants';
import { CreateContentButton } from '@shared-ui/buttons';
import { getRelativeTime, isComputer } from '@shared-ui/utils';
import { Post, PostData } from '@shared-ui/types';
import { CurrentCommentContext } from '@shared-ui/providers';
import {
    SkeletonPostItem,
    SkeletonComment,
    CommentEditor,
} from '@shared-ui/small-components';
import { createApolloClient } from '@shared-ui/utils';

interface PostPageProps {
    post: Post;
    user: {
        username: string;
        [key: string]: any;
    } | null;
    parentCommentId: string | null;
    initialApolloState: any;
}

export const PostPage: React.FC<PostPageProps> = ({
    post,
    user,
    parentCommentId,
}) => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [scrollY, setScrollY] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);
    const client = useApolloClient();

    // Dispatch action to load the user into Redux
    useEffect(() => {
        dispatch(loadUser());
    }, [dispatch]);

    // Compute username from server-fetched user data.
    const computedUserId = post?.postedByUserId || post?.user || '';
    const resolvedUsername = user?.username || 'Username';
    const rawTime = post?.postedAt || post?.time || '';
    const formattedTime = rawTime ? getRelativeTime(rawTime) : 'Unknown time';

    const postData: PostData = {
        id: post?.id ?? '',
        user: resolvedUsername,
        time: formattedTime,
        title: post?.title ?? '',
        flair: post?.flair || '',
        upvotes: post?.upvotes ?? 0,
        commentsCount: post?.commentsCount ?? 0,
        content: post?.content ?? '',
        attachmentUrls: post?.attachmentUrls || [],
    };

    const {
        setParentUser,
        setParentContent,
        setParentDate,
        setPostId,
        setParentAttachmentUrls,
    } = useContext(CurrentCommentContext);

    const setPostContent = useCallback(() => {
        if (postData?.id) setPostId(postData.id);
        if (postData?.user) setParentUser(postData.user);
        if (postData?.content) setParentContent(postData.content);
        if (post?.postedAt) setParentDate(post.postedAt);
        if (postData?.attachmentUrls) {
            setParentAttachmentUrls(postData.attachmentUrls);
        }
    }, [
        postData?.id,
        postData?.user,
        postData?.content,
        post?.postedAt,
        postData?.attachmentUrls,
        setPostId,
        setParentUser,
        setParentContent,
        setParentDate,
        setParentAttachmentUrls,
    ]);

    useEffect(() => {
        setPostContent();
    }, [setPostContent]);

    // onScroll handler updates scrollY state.
    const handleScroll = (event: any) => {
        const currentY = event.nativeEvent.contentOffset.y;
        setScrollY(currentY);
    };

    // Determine if device is desktop vs mobile.
    const isDesktop = isComputer();
    const BOTTOM_INPUT_HEIGHT = 60;
    const isWeb = Platform.OS === 'web';

    // Dynamic styles based on platform and device type.
    const computedStyles = StyleSheet.create({
        safeContainer: {
            flex: 1,
            backgroundColor: COLORS.SecondaryBackground,
            paddingTop: 15,
            ...(isWeb && { minHeight: '100vh', display: 'flex' }), // Added minHeight for web
        },
        container: { flex: 1 },
        mainContainer: {
            flex: 1,
            position: 'relative',
            ...(isDesktop ? {} : { paddingBottom: BOTTOM_INPUT_HEIGHT }),
        },
        scrollSection: isWeb
            ? isDesktop
                ? {
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      overflowY: 'auto',
                  }
                : {
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
        createContentButtonContainer: isDesktop
            ? {}
            : {
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: BOTTOM_INPUT_HEIGHT,
              },
    });

    const ContainerComponent = isWeb ? View : KeyboardAvoidingView;
    const containerProps = isWeb
        ? { style: computedStyles.container }
        : {
              style: computedStyles.container,
              behavior: Platform.OS === 'ios' ? 'padding' : undefined,
          };

    return (
        <SafeAreaView style={computedStyles.safeContainer}>
            <ContainerComponent {...containerProps}>
                <View style={computedStyles.mainContainer}>
                    <ScrollView
                        ref={scrollViewRef}
                        style={computedStyles.scrollSection}
                        contentContainerStyle={computedStyles.scrollView}
                        keyboardShouldPersistTaps="handled"
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
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
                                router.back();
                            }}
                            variant="details"
                            group="My cool group"
                        />
                        {isDesktop && (
                            <CommentEditor
                                postId={postData.id}
                                // eslint-disable-next-line unicorn/no-null
                                parentCommentId={parentCommentId ?? null}
                                onCommentCreated={() => {
                                    // For production, consider showing a loading state while refetching.
                                    void client.refetchQueries({
                                        include: [FETCH_POST_COMMENTS_QUERY],
                                    });
                                }}
                                onCancel={() => {
                                    // Optional cancel handler.
                                }}
                            />
                        )}
                        <CommentsManager
                            postId={postData.id}
                            parentCommentId={parentCommentId}
                            scrollY={scrollY}
                        />
                    </ScrollView>
                    {!isDesktop && (
                        <View
                            style={computedStyles.createContentButtonContainer}
                        >
                            <CreateContentButton
                                buttonText="Write a comment..."
                                onPress={() => {
                                    setPostContent();
                                    void router.push('/create-comment');
                                }}
                            />
                        </View>
                    )}
                </View>
            </ContainerComponent>
        </SafeAreaView>
    );
};

export default PostPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
    // Extract route params and query string values.
    const { postId } = context.params as { postId: string };
    const { post: postString, parentCommentId } = context.query;
    let parsedPost: Post | null = null;

    // If a "post" JSON string is passed in the query, try to parse it.
    if (postString) {
        try {
            parsedPost = JSON.parse(postString as string);
        } catch (e) {
            console.error('Failed to parse post from query:', e);
        }
    }

    const client = createApolloClient();

    let postData;

    // If the post was not provided via query params, fetch it from your GraphQL API.
    if (!parsedPost) {
        const { data } = await client.query({
            query: FETCH_POST_QUERY,
            variables: { postId },
        });
        postData = data?.fetchPost;
    } else {
        postData = parsedPost;
    }

    // Compute the user ID to fetch the user.
    const computedUserId = postData?.postedByUserId || postData?.user || '';
    let userData = null;
    if (computedUserId) {
        const { data } = await client.query({
            query: FETCH_USER_QUERY,
            variables: { userId: computedUserId },
        });
        userData = data?.fetchUser;
    }

    // For production consider error handling here if queries fail.
    return {
        props: {
            initialApolloState: client.cache.extract(),
            post: postData,
            user: userData,
            parentCommentId: parentCommentId || null,
        },
    };
};
