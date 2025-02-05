// FeedChannelScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
    Text,
    SafeAreaView,
    FlatList,
    StyleSheet,
    useWindowDimensions,
} from 'react-native';
import { useApolloClient } from '@apollo/client';
import { Header, PostItem } from '../sections';
import { COLORS } from '../constants';
import { FETCH_CHANNEL_POSTS_QUERY, FETCH_USER_QUERY } from '../queries';
import { GroupChannelPostMessage, GroupChannel, User } from '../types';
import { CreateContentButton } from '../buttons';

/** -----------------------------
 * Shared Types & Models
 ----------------------------- */
export type FeedPost = {
    id: string;
    user: string;
    domain: string;
    title: string;
    upvotes: number;
    commentsCount: number;
    shareCount: number;
    time: string;
    thumbnail: string;
};

export type FeedChannelScreenProps = {
    navigation: any;
    channel?: GroupChannel;
    route?: { params: { channel: GroupChannel } };
};

/** -----------------------------
 * Helper: Convert Date to Relative Time
 ----------------------------- */
const getRelativeTime = (postedDate: Date): string => {
    const diff = Date.now() - postedDate.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
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
    },
    // We remove the old floating button & old modal styles if they’re no longer needed
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
    const { width } = useWindowDimensions();
    const apolloClient = useApolloClient();
    const userCacheRef = useRef<Record<string, string>>({});

    const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);

    // The states for controlling the “Create New Post” modal & fields
    const [modalVisible, setModalVisible] = useState(false);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');

    useEffect(() => {
        if (!channel) return;

        let cancelled = false;
        const fetchPosts = async () => {
            try {
                const { data } = await apolloClient.query<{
                    fetchFeedPosts: GroupChannelPostMessage[];
                }>({
                    query: FETCH_CHANNEL_POSTS_QUERY,
                    variables: { channelId: channel.id, offset: 0 },
                    fetchPolicy: 'network-only',
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
                                fetchPolicy: 'network-only',
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
                            time: getRelativeTime(new Date(msg.postedAt)),
                            thumbnail:
                                msg.thumbnail ||
                                `https://picsum.photos/seed/${username}/48`,
                        } as FeedPost;
                    })
                );
                if (!cancelled) {
                    console.log('feed loaded');
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

    if (!channel) {
        return (
            <SafeAreaView style={styles.container}>
                <Text
                    style={{
                        color: COLORS.White,
                        textAlign: 'center',
                        marginTop: 20,
                    }}
                >
                    No channel provided.
                </Text>
            </SafeAreaView>
        );
    }

    const renderItem = ({ item }: { item: FeedPost }) => {
        const handlePress = () => {
            navigation.navigate('PostScreen', { post: item });
        };
        return (
            <PostItem
                user={item.user}
                time={item.time}
                title={item.title}
                upvotes={item.upvotes}
                commentsCount={item.commentsCount}
                thumbnail={item.thumbnail}
                onPress={handlePress}
            />
        );
    };

    const handleCreatePost = () => {
        const newPost: FeedPost = {
            id: Math.random().toString(),
            user: 'You',
            domain: '',
            title: newPostTitle,
            upvotes: 0,
            commentsCount: 0,
            shareCount: 0,
            time: 'Just now',
            thumbnail: `https://picsum.photos/seed/you/48`,
        };
        // Prepend new post to the feed
        setFeedPosts((prevPosts) => [newPost, ...prevPosts]);
        // Clear inputs
        setNewPostTitle('');
        setNewPostContent('');
        // Close modal
        setModalVisible(false);
    };

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
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.feedList}
            />

            {/* Reuse the CreateContentButton instead of a floating “+” button */}
            <CreateContentButton
                modalVisible={modalVisible}
                setModalVisible={setModalVisible}
                contentText={newPostTitle}
                setContentText={setNewPostTitle}
                handleCreate={handleCreatePost}
                buttonText="Create a new post" // The bottom button
                modalTitle="Create New Post" // The title inside the modal
                /** We want two text fields: one for Title, one for Content */
                showSecondField
                secondContentText={newPostContent}
                setSecondContentText={setNewPostContent}
                /** Customize placeholders for each input */
                placeholderText="Title"
                placeholderText2="Content"
                multilineSecondField

                /** Optionally override modal styles or title text style if desired */
                // modalContainerStyle={{ ... }}
                // modalTitleStyle={{ ... }}
            />
        </SafeAreaView>
    );
};
