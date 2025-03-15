import React, { useEffect, useContext, useRef, useState } from 'react';
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
import { useQuery } from '@apollo/client';
import { useAppDispatch, loadUser } from '../redux';
import { FETCH_POST_QUERY, FETCH_USER_QUERY } from '../queries';
import { PostItem, CommentsManager } from '../sections';
import { COLORS } from '../constants';
import { CreateContentButton } from '../buttons';
import { getRelativeTime } from '../utils';
import { Post, PostData } from '../types';
import { CurrentCommentContext } from '../providers';
import { SkeletonPostItem, SkeletonComment } from '../small-components';

type RootStackParamList = {
    PostScreen: { id?: number; post?: Post; parentCommentId?: string };
};

type PostScreenProps = {
    navigation: NavigationProp<RootStackParamList, 'PostScreen'>;
    route: RouteProp<RootStackParamList, 'PostScreen'>;
};

const BOTTOM_INPUT_HEIGHT = 60;
const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
    // @ts-expect-error web only types
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
        paddingBottom: BOTTOM_INPUT_HEIGHT,
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

export const PostScreen: React.FC<PostScreenProps> = ({
    route,
    navigation,
}) => {
    const { id, post, parentCommentId } = route.params;
    const dispatch = useAppDispatch();
    const [scrollY, setScrollY] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        dispatch(loadUser());
    }, [dispatch]);

    // Fetch post if not passed in route params.
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

    // Update header title: show "Nexus" while loading, then post title once loaded.
    useEffect(() => {
        if (loading) {
            navigation.setOptions({ title: 'Nexus' });
        } else if (postData.title) {
            navigation.setOptions({ title: postData.title });
        }
    }, [loading, postData.title, navigation]);

    // Create a ref for CommentsManager (if needed for additional control)
    const commentsManagerRef = useRef<{ checkScrollPosition: () => void }>(
        null
    );

    // onScroll handler: update scrollY state.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleScroll = (event: any) => {
        const currentY = event.nativeEvent.contentOffset.y;
        setScrollY(currentY);
        // Also call the CommentsManager's checkScrollPosition
        if (commentsManagerRef.current) {
            commentsManagerRef.current.checkScrollPosition();
        }
    };

    if (loading) {
        return (
            // @ts-expect-error web only types
            <SafeAreaView style={styles.safeContainer}>
                {/* @ts-expect-error web only types */}
                <View style={styles.mainContainer}>
                    {/* @ts-expect-error web only types */}
                    <ScrollView
                        ref={scrollViewRef}
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
            {/* @ts-expect-error web only types */}
            <ContainerComponent {...containerProps}>
                {/* @ts-expect-error web only types */}
                <View style={styles.mainContainer}>
                    {/* @ts-expect-error web only types */}
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.scrollSection}
                        contentContainerStyle={styles.scrollView}
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
                                if (navigation.canGoBack()) {
                                    navigation.goBack();
                                } else {
                                    // @ts-expect-error navigation
                                    navigation.navigate('AppDrawer');
                                }
                            }}
                            variant="details"
                            group="My cool group"
                        />
                        <CommentsManager
                            // @ts-expect-error ref
                            ref={commentsManagerRef}
                            postId={postData.id}
                            parentCommentId={parentCommentId}
                            scrollY={scrollY}
                        />
                    </ScrollView>
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
