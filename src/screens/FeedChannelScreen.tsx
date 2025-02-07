import React, { useState, useEffect, useRef } from 'react';
import {
    Text,
    SafeAreaView,
    FlatList,
    StyleSheet,
    useWindowDimensions,
    Platform,
} from 'react-native';
import { useApolloClient, useMutation } from '@apollo/client';
import { Header, PostItem } from '../sections';
import { COLORS } from '../constants';
import {
    FETCH_CHANNEL_POSTS_QUERY,
    FETCH_USER_QUERY,
    CREATE_GROUP_CHANNEL_POST_MUTATION,
} from '../queries';
import { GroupChannelPostMessage, User } from '../types';
import { CreateContentButton } from '../buttons';
import { useAppSelector, RootState, UserType } from '../redux';

// If not already defined elsewhere, you can add minimal type definitions here:
interface FeedChannelScreenProps {
    navigation: any;
    channel?: any;
    route?: any;
}

interface FeedPost {
    id: string;
    user: string;
    domain: string;
    title: string;
    upvotes: number;
    commentsCount: number;
    shareCount: number;
    content: string;
    time: string;
    thumbnail: string;
}

/** -----------------------------
 * Helper: Convert Date to Relative Time
 ----------------------------- */
const getRelativeTime = (postedDate: Date): string => {
    const diff = Date.now() - postedDate.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo`;
    const years = Math.floor(days / 365);
    return `${years}y`;
};

/** -----------------------------
 * Styles
 ----------------------------- */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.SecondaryBackground,
    },
    feedList: {
        padding: 15,
        // Extra bottom padding will be added conditionally in the component
    },
});

/** -----------------------------
 * FeedChannelScreen
 ----------------------------- */
export const FeedChannelScreen: React.FC<FeedChannelScreenProps> = ({
    navigation,
    channel: channelProp,
    route,
}) => {
    const channel = channelProp || route?.params?.channel;
    const user: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );
    const { width } = useWindowDimensions();
    const apolloClient = useApolloClient();
    const userCacheRef = useRef<Record<string, string>>({});
    const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');

    // Apollo mutation hook for creating posts
    const [createPostMutation, { loading: creatingPost }] = useMutation(
        CREATE_GROUP_CHANNEL_POST_MUTATION,
        {
            refetchQueries: [
                {
                    query: FETCH_CHANNEL_POSTS_QUERY,
                    variables: { channelId: channel?.id, offset: 0 },
                },
            ],
            awaitRefetchQueries: true, // Ensures fresh data before UI updates
            onCompleted: () => {
                setModalVisible(false); // Close modal after post creation
                setNewPostTitle(''); // Clear input
                setNewPostContent(''); // Clear input
            },
            onError: (error) => {
                console.error('Error creating post:', error);
            },
        }
    );

    useEffect(() => {
        if (!channel) return;
        let cancelled = false;

        const fetchPosts = async () => {
            try {
                console.log('Starting to load feed:', new Date());
                const { data } = await apolloClient.query<{
                    fetchFeedPosts: GroupChannelPostMessage[];
                }>({
                    query: FETCH_CHANNEL_POSTS_QUERY,
                    variables: { channelId: channel.id, offset: 0 },
                });

                const postsData = data.fetchFeedPosts.filter(
                    (msg) => msg.messageType === 'post'
                ) as GroupChannelPostMessage[];

                const posts: FeedPost[] = await Promise.all(
                    postsData.map(async (msg) => {
                        let username: string;
                        if (userCacheRef.current[msg.postedByUserId]) {
                            username = userCacheRef.current[msg.postedByUserId];
                        } else {
                            const userResult = await apolloClient.query<{
                                fetchUser: User;
                            }>({
                                query: FETCH_USER_QUERY,
                                variables: { userId: msg.postedByUserId },
                            });
                            username = userResult.data.fetchUser.username;
                            userCacheRef.current[msg.postedByUserId] = username;
                        }
                        return {
                            id: msg.id,
                            user: username,
                            domain: msg.domain || '',
                            title: msg.title,
                            upvotes: msg.upvotes,
                            commentsCount: msg.commentsCount,
                            shareCount: msg.shareCount,
                            content: msg.content,
                            time: getRelativeTime(new Date(msg.postedAt)),
                            thumbnail:
                                msg.thumbnail ||
                                `https://picsum.photos/seed/${username}/48`,
                        } as FeedPost;
                    })
                );
                if (!cancelled) {
                    console.log('Feed loaded', new Date());
                    setFeedPosts(posts);
                }
            } catch (error) {
                console.error('Error fetching feed posts:', error);
            }
        };

        void fetchPosts();
        return () => {
            cancelled = true;
        };
    }, [apolloClient, channel]);

    const handleCreatePost = async () => {
        if (!channel || !user?.id || creatingPost) return;
        await createPostMutation({
            variables: {
                postedByUserId: user.id,
                channelId: channel.id,
                content: newPostContent,
                title: newPostTitle,
            },
        });
    };

    // Determine if we're on desktop (web) by checking platform and width
    const isDesktop = Platform.OS === 'web' && width > 768;

    return (
        <SafeAreaView style={styles.container}>
            <Header
                isLargeScreen={width > 768}
                channel={channel}
                navigation={navigation}
            />

            <FlatList
                style={{ flex: 1 }}
                data={feedPosts}
                renderItem={({ item }) => (
                    <PostItem
                        user={item.user}
                        time={item.time}
                        title={item.title}
                        upvotes={item.upvotes}
                        commentsCount={item.commentsCount}
                        thumbnail={item.thumbnail}
                        onPress={() =>
                            navigation.navigate('PostScreen', { post: item })
                        }
                        content={item.content}
                        preview
                    />
                )}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                    styles.feedList,
                    isDesktop ? { paddingBottom: 60 } : {},
                ]}
            />

            <CreateContentButton
                modalVisible={modalVisible}
                setModalVisible={setModalVisible}
                contentText={newPostTitle}
                setContentText={setNewPostTitle}
                handleCreate={handleCreatePost}
                buttonText="Create a new post"
                modalTitle="Create New Post"
                showSecondField
                secondContentText={newPostContent}
                setSecondContentText={setNewPostContent}
                placeholderText="Title"
                placeholderText2="Content"
                multilineSecondField
            />
        </SafeAreaView>
    );
};
