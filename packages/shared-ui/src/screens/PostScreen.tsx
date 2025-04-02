import React, { useEffect, useContext, useCallback, useMemo } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Text,
} from 'react-native';
import { useApolloClient, useQuery } from '@apollo/client';
import { useNexusRouter, createNexusParam } from '../hooks';
import { useAppDispatch, loadUser } from '../redux';
import {
    FETCH_POST_QUERY,
    FETCH_USER_QUERY,
    FETCH_POST_COMMENTS_QUERY,
} from '../queries';
import { PostItem, CommentsManager } from '../sections';
import { COLORS } from '../constants';
import { CreateContentButton } from '../buttons';
import { getRelativeTime, isComputer } from '../utils';
import type { Post, PostData, User } from '../types';
import { CurrentCommentContext } from '../providers';
import {
    SkeletonPostItem,
    SkeletonComment,
    CommentEditor,
} from '../small-components';

type PostScreenProps = {
    id?: string;
    post?: Post;
    user?: User;
    parentCommentId?: string;
};

// Replace react navigation params with createNexusParam hook
const { useParams } = createNexusParam<{
    id?: string;
    post?: Post;
    user?: User;
    parentCommentId?: string;
}>();

export const PostScreen: React.FC<PostScreenProps> = (props) => {
    // Use our custom router
    const { push, goBack } = useNexusRouter();

    const { params } = useParams();

    // Use props if provided, else fallback to nexus params
    const id = props.id || params.id;
    const postObj: Post | undefined = props.post || params.post;
    const userProp = props.user || params.user;
    const parentCommentId = props.parentCommentId || params.parentCommentId;

    const dispatch = useAppDispatch();
    const client = useApolloClient();

    // Dispatch action to load the user into Redux
    useEffect(() => {
        dispatch(loadUser());
    }, [dispatch]);

    // Fetch the post if it was not passed in via props.
    const { data, loading, error } = useQuery(FETCH_POST_QUERY, {
        variables: { postId: postObj ? postObj.id : id },
        skip: !!postObj,
    });

    const feedPost: Post | undefined = postObj || data?.fetchPost;
    const computedUserId =
        feedPost?.postedByUserId ||
        feedPost?.user ||
        data?.fetchPost?.postedByUserId ||
        data?.fetchPost?.user ||
        '';

    // Fetch the user details if needed.
    const { data: userData } = useQuery(FETCH_USER_QUERY, {
        variables: { userId: computedUserId },
        skip: computedUserId === '',
    });

    const rawTime = feedPost?.postedAt || feedPost?.time || '';
    const formattedTime = rawTime ? getRelativeTime(rawTime) : 'Unknown time';
    const resolvedUsername =
        userProp?.username || userData?.fetchUser?.username || 'Username';

    // Memoize postData to prevent unnecessary re-creations that could trigger an update loop.
    const postData: PostData = useMemo(
        () => ({
            id: feedPost?.id ?? '',
            user: resolvedUsername,
            time: formattedTime,
            title: feedPost?.title ?? '',
            flair: feedPost?.flair || '',
            upvotes: feedPost?.upvotes ?? 0,
            commentsCount: feedPost?.commentsCount ?? 0,
            content: feedPost?.content ?? '',
            attachmentUrls: feedPost?.attachmentUrls || [],
        }),
        [JSON.stringify(feedPost), resolvedUsername, formattedTime]
    );

    const {
        setParentUser,
        setParentContent,
        setParentDate,
        setPostId,
        setParentAttachmentUrls,
    } = useContext(CurrentCommentContext);

    // Wrap the update logic in a useCallback so that it only runs when dependencies change.
    const setPostContent = useCallback(() => {
        if (postData?.id) setPostId(postData.id);
        if (postData?.user) setParentUser(postData.user);
        if (postData?.content) setParentContent(postData.content);
        if (feedPost?.postedAt) setParentDate(feedPost.postedAt);
        if (postData?.attachmentUrls) {
            setParentAttachmentUrls(postData.attachmentUrls);
        }
    }, [
        postData?.id,
        postData?.user,
        postData?.content,
        feedPost?.postedAt,
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

    // Determine if device is computer (desktop) or mobile.
    const isDesktop = isComputer();
    const BOTTOM_INPUT_HEIGHT = 60;
    const isWeb = Platform.OS === 'web';

    // Create dynamic styles based on device type.
    const computedStyles = StyleSheet.create({
        safeContainer: {
            flex: 1,
            backgroundColor: COLORS.SecondaryBackground,
            paddingTop: 15,
            ...(isWeb && { minHeight: '100vh', display: 'flex' }),
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

    if (loading) {
        return (
            <SafeAreaView style={computedStyles.safeContainer}>
                <View style={computedStyles.mainContainer}>
                    <ScrollView
                        style={computedStyles.scrollSection}
                        contentContainerStyle={computedStyles.scrollView}
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
            <SafeAreaView style={computedStyles.safeContainer}>
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
                        style={computedStyles.scrollSection}
                        contentContainerStyle={computedStyles.scrollView}
                        keyboardShouldPersistTaps="handled"
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
                                goBack();
                            }}
                            variant="details"
                            group="My cool group"
                        />
                        {isDesktop && (
                            // Show inline CommentEditor on computer
                            <CommentEditor
                                postId={postData.id}
                                parentCommentId={parentCommentId ?? null}
                                onCommentCreated={() => {
                                    // When a top-level comment is created, refetch comments.
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
                        />
                    </ScrollView>
                    {!isDesktop && (
                        // Show CreateContentButton on mobile; reset comment context before navigating.
                        <View
                            style={computedStyles.createContentButtonContainer}
                        >
                            <CreateContentButton
                                buttonText="Write a comment..."
                                onPress={() => {
                                    setPostContent();
                                    push('/create-comment');
                                }}
                            />
                        </View>
                    )}
                </View>
            </ContainerComponent>
        </SafeAreaView>
    );
};
