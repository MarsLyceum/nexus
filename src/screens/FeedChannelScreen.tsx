// FeedChannelScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    FlatList,
    TouchableOpacity,
    Modal,
    TextInput,
    Pressable,
    StyleSheet,
    useWindowDimensions,
} from 'react-native';
import { useApolloClient } from '@apollo/client';
import { Header, PostItem } from '../sections';
import { COLORS } from '../constants';
import { FETCH_CHANNEL_POSTS_QUERY, FETCH_USER_QUERY } from '../queries';
import { GroupChannelPostMessage, GroupChannel, User } from '../types';

// -----------------------------
// Shared Types & Models
// -----------------------------
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

// -----------------------------
// Updated Props
// -----------------------------
export type FeedChannelScreenProps = {
    navigation: any;
    channel?: GroupChannel;
    route?: { params: { channel: GroupChannel } };
};

// -----------------------------
// Helper: Convert Date to Relative Time
// -----------------------------
const getRelativeTime = (postedDate: Date): string => {
    const diff = Date.now() - postedDate.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
};

// -----------------------------
// Styles
// -----------------------------
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.PrimaryBackground,
    },
    feedList: {
        padding: 15,
    },
    newPostButton: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        backgroundColor: COLORS.Primary,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 2,
    },
    newPostButtonText: {
        color: COLORS.White,
        fontSize: 30,
        lineHeight: 30,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '85%',
        backgroundColor: COLORS.AppBackground,
        borderRadius: 8,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
        color: COLORS.White,
    },
    textInput: {
        borderWidth: 1,
        borderColor: COLORS.InactiveText,
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
        color: COLORS.White,
    },
    modalButtonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    modalButton: {
        marginLeft: 10,
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
        backgroundColor: COLORS.Primary,
    },
    modalButtonText: {
        color: COLORS.White,
        fontWeight: '600',
    },
});

// -----------------------------
// FeedChannelScreen Component
// -----------------------------
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
        setFeedPosts((prevPosts) => [newPost, ...prevPosts]);
        setNewPostTitle('');
        setNewPostContent('');
        setModalVisible(false);
    };

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

    return (
        <SafeAreaView style={styles.container}>
            <Header
                isLargeScreen={width > 768}
                channel={channel}
                navigation={navigation}
            />

            <FlatList
                data={feedPosts}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.feedList}
            />

            <TouchableOpacity
                style={styles.newPostButton}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.newPostButtonText}>+</Text>
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Create New Post</Text>
                        <TextInput
                            placeholder="Title"
                            placeholderTextColor={COLORS.InactiveText}
                            style={styles.textInput}
                            value={newPostTitle}
                            onChangeText={setNewPostTitle}
                        />
                        <TextInput
                            placeholder="Content"
                            placeholderTextColor={COLORS.InactiveText}
                            style={[styles.textInput, { height: 80 }]}
                            value={newPostContent}
                            onChangeText={setNewPostContent}
                            multiline
                        />
                        <View style={styles.modalButtonRow}>
                            <Pressable
                                style={styles.modalButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>
                                    Cancel
                                </Text>
                            </Pressable>
                            <Pressable
                                style={styles.modalButton}
                                onPress={handleCreatePost}
                            >
                                <Text style={styles.modalButtonText}>
                                    Create
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};
