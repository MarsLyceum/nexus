// FeedChannelScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
    SafeAreaView,
    FlatList,
    StyleSheet,
    useWindowDimensions,
    Platform,
    View,
} from 'react-native';
import { useApolloClient, useMutation } from '@apollo/client';
import { NavigationProp, RouteProp } from '@react-navigation/core';
import { Header, PostItem } from '../sections';
import { COLORS } from '../constants';
import {
    FETCH_CHANNEL_POSTS_QUERY,
    FETCH_USER_QUERY,
    CREATE_GROUP_CHANNEL_POST_MUTATION,
} from '../queries';
import { GroupChannelPostMessage, User, GroupChannel } from '../types';
import { CreateContentButton } from '../buttons';
import { useAppSelector, RootState, UserType } from '../redux';
import { getRelativeTime } from '../utils';

type RootStackParamList = {
    FeedChannelScreen: {
        channel: GroupChannel;
    };
    PostScreen: {
        id: string;
        post: FeedPost;
    };
};

interface FeedChannelScreenProps {
    navigation: NavigationProp<RootStackParamList, 'FeedChannelScreen'>;
    channel?: GroupChannel;
    route?: RouteProp<RootStackParamList, 'FeedChannelScreen'>;
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
 * Styles (using the provided color palette)
 ----------------------------- */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.SecondaryBackground, // #382348
    },
    feedList: {
        padding: 15,
    },
    // Skeleton styles for feed post placeholder
    skeletonContainer: {
        backgroundColor: COLORS.PrimaryBackground, // #281B31
        padding: 15,
        marginBottom: 10,
        borderRadius: 8,
        shadowColor: COLORS.OffWhite, // #F2F3F5
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 2,
    },
    skeletonHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    skeletonAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.InactiveText, // #989898
    },
    skeletonTextBlock: {
        height: 20,
        backgroundColor: COLORS.InactiveText, // #989898
        borderRadius: 4,
        marginLeft: 10,
        flex: 1,
    },
    skeletonTitle: {
        height: 20,
        backgroundColor: COLORS.InactiveText, // #989898
        borderRadius: 4,
        marginBottom: 10,
    },
    skeletonContent: {
        height: 60,
        backgroundColor: COLORS.InactiveText, // #989898
        borderRadius: 4,
    },
});

/** -----------------------------
 * SkeletonPostItem Component
 * ----------------------------- */
const SkeletonPostItem: React.FC = () => (
    <View style={styles.skeletonContainer}>
        <View style={styles.skeletonHeader}>
            <View style={styles.skeletonAvatar} />
            <View style={[styles.skeletonTextBlock, { width: '60%' }]} />
        </View>
        <View style={[styles.skeletonTitle, { width: '80%' }]} />
        <View
            style={[styles.skeletonContent, { width: '100%', marginTop: 10 }]}
        />
    </View>
);

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
    const [loadingFeed, setLoadingFeed] = useState<boolean>(true);
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
            awaitRefetchQueries: true,
            onCompleted: () => {
                setModalVisible(false);
                setNewPostTitle('');
                setNewPostContent('');
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
                );

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
                    setLoadingFeed(false);
                }
            } catch (error) {
                console.error('Error fetching feed posts:', error);
                if (!cancelled) {
                    setLoadingFeed(false);
                }
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
                headerText={channel?.name ?? ''}
                navigation={navigation}
            />

            {/* While loading, display skeleton placeholders; otherwise, display the feed posts */}
            {loadingFeed ? (
                <FlatList
                    style={{ flex: 1 }}
                    data={[0, 1, 2, 3, 4]} // Display 5 skeleton items
                    keyExtractor={(item) => item.toString()}
                    renderItem={() => <SkeletonPostItem />}
                    contentContainerStyle={[
                        styles.feedList,
                        isDesktop ? { paddingBottom: 60 } : {},
                    ]}
                />
            ) : (
                <FlatList
                    style={{ flex: 1 }}
                    data={feedPosts}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <PostItem
                            id={item.id}
                            username={item.user}
                            time={item.time}
                            title={item.title}
                            upvotes={item.upvotes}
                            commentsCount={item.commentsCount}
                            thumbnail={item.thumbnail}
                            content={item.content}
                            preview
                            variant="feed"
                            onPress={() =>
                                navigation.navigate('PostScreen', {
                                    id: item.id,
                                    // post: item,
                                })
                            }
                        />
                    )}
                    contentContainerStyle={[
                        styles.feedList,
                        isDesktop ? { paddingBottom: 60 } : {},
                    ]}
                />
            )}

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
