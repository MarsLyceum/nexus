import React, { useState } from 'react';
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
import { FETCH_POST_QUERY, FETCH_USER_QUERY } from '../queries';
import { PostItem, CommentThread, CommentNode, Attachment } from '../sections';
import { COLORS } from '../constants';
import { CreateContentButton } from '../buttons';
import { useAppSelector, RootState, UserType } from '../redux';
import { getRelativeTime } from '../utils';

type Post = {
    id: string;
    user?: string;
    time?: string;
    title: string;
    flair?: string;
    upvotes: number;
    commentsCount: number;
    content: string;
    postedByUserId?: string;
    postedAt?: string;
    attachmentUrls?: string[]; // <-- Added attachmentUrls field
};

type RootStackParamList = {
    PostScreen: { id?: number; post?: Post };
};

type PostScreenProps = {
    navigation: NavigationProp<RootStackParamList, 'PostScreen'>;
    route: RouteProp<RootStackParamList, 'PostScreen'>;
};

type PostData = {
    id: string;
    user: string;
    time: string;
    title: string;
    flair: string;
    upvotes: number;
    commentsCount: number;
    content: string;
    attachmentUrls: string[]; // <-- Added attachmentUrls field
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
              // @ts-expect-error web only type
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

    // Fetch the post if it wasn’t passed in via navigation.
    const { data, loading, error } = useQuery(FETCH_POST_QUERY, {
        variables: { postId: post ? post.id : id?.toString() },
        skip: !!post, // skip if a post was already passed in
    });

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

    // Always call these state hooks.
    const [comments, setComments] = useState<CommentNode[]>([
        {
            id: 'comment-1',
            user: 'myersthekid',
            time: '6h',
            upvotes: 107,
            content:
                "I hear people all the time say they've done a 360 in their life instead of a 180. Haha",
            children: [
                {
                    id: 'comment-2',
                    user: 'FrostySand8997',
                    time: '5h',
                    upvotes: 30,
                    content:
                        'This trashy girl once told me and my wife that she did a 380. We still laugh about her dumb ass 20 years later... so u spun around all the way plus a little bit?',
                    children: [
                        {
                            id: 'comment-3',
                            user: 'myersthekid',
                            time: '5h',
                            upvotes: 12,
                            content:
                                'Okay, but a 380 is actually super impressive hahaha',
                            children: [],
                        },
                    ],
                },
            ],
        },
    ]);
    const [modalVisible, setModalVisible] = useState(false);
    const [newCommentContent, setNewCommentContent] = useState('');
    // NEW: Attachments state for CreateContentButton
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const user: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );

    // If the post query is still loading, render the skeleton screen.
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

    // Use the provided post if available; otherwise, use the fetched post.
    const feedPost: Post = post || data.fetchPost;

    // Format the time using our utility function.
    const rawTime = feedPost.postedAt || feedPost.time || '';
    const formattedTime = rawTime ? getRelativeTime(rawTime) : 'Unknown time';

    // Resolve the username from the fetched user data.
    const resolvedUsername = userData?.fetchUser?.username || 'Username';

    // Map the post fields into our local PostData type.
    const postData: PostData = {
        id: feedPost.id,
        user: resolvedUsername,
        time: formattedTime,
        title: feedPost.title,
        flair: feedPost.flair || '',
        upvotes: feedPost.upvotes,
        commentsCount: feedPost.commentsCount,
        content: feedPost.content,
        attachmentUrls: feedPost.attachmentUrls || [],
    };

    const handleCreateComment = () => {
        if (newCommentContent.trim() !== '') {
            const newComment: CommentNode = {
                id: `comment-new-${Date.now()}`,
                user: user?.username ?? '',
                time: 'Just now',
                upvotes: 0,
                content: newCommentContent,
                children: [],
            };
            setComments((prevComments) => [newComment, ...prevComments]);
            setNewCommentContent('');
            setModalVisible(false);
        }
    };

    const ContainerComponent = isWeb ? View : KeyboardAvoidingView;
    const containerProps = isWeb
        ? { style: styles.container }
        : {
              style: styles.container,
              behavior: Platform.OS === 'ios' ? 'padding' : undefined,
          };

    return (
        <SafeAreaView style={styles.safeContainer}>
            {/* @ts-expect-error props */}
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
                                    // @ts-expect-error navigation
                                    navigation.navigate('AppDrawer');
                                }
                            }}
                            fromReddit={Math.random() < 0.2}
                            variant="details"
                            group="My cool group"
                        />
                        {comments.map((c) => (
                            <CommentThread
                                key={c.id}
                                comment={c}
                                level={0}
                                opUser={postData.user}
                            />
                        ))}
                    </ScrollView>
                    {/* Fixed CreateContentButton at the bottom */}
                    <View style={styles.createContentButtonContainer}>
                        <CreateContentButton
                            modalVisible={modalVisible}
                            setModalVisible={setModalVisible}
                            contentText={newCommentContent}
                            setContentText={setNewCommentContent}
                            handleCreate={handleCreateComment}
                            buttonText="Write a comment..."
                            attachments={attachments}
                            setAttachments={setAttachments}
                        />
                    </View>
                </View>
            </ContainerComponent>
        </SafeAreaView>
    );
};
