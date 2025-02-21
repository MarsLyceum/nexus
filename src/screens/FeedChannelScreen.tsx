// FeedChannelScreen.tsx
import React, { useState } from 'react';
import {
    SafeAreaView,
    FlatList,
    StyleSheet,
    useWindowDimensions,
    Platform,
    View,
} from 'react-native';
import { NavigationProp, RouteProp } from '@react-navigation/core';
import { Header, PostItem, Attachment } from '../sections';
import { COLORS } from '../constants';
import { CreateContentButton } from '../buttons';
import { useAppSelector, RootState, UserType } from '../redux';
import { FeedPost } from '../types';
import { useFeedPosts } from '../hooks/useFeedPosts';
import { useCreatePost } from '../hooks/useCreatePost';

type RootStackParamList = {
    FeedChannelScreen: {
        channel: any; // Replace 'any' with your GroupChannel type if available
    };
    PostScreen: {
        id: string;
    };
};

interface FeedChannelScreenProps {
    navigation: NavigationProp<RootStackParamList, 'FeedChannelScreen'>;
    channel?: any;
    route?: RouteProp<RootStackParamList, 'FeedChannelScreen'>;
}

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
    skeletonContainer: {
        backgroundColor: COLORS.PrimaryBackground,
        padding: 15,
        marginBottom: 10,
        borderRadius: 8,
        shadowColor: COLORS.OffWhite,
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
        backgroundColor: COLORS.InactiveText,
    },
    skeletonTextBlock: {
        height: 20,
        backgroundColor: COLORS.InactiveText,
        borderRadius: 4,
        marginLeft: 10,
        flex: 1,
    },
    skeletonTitle: {
        height: 20,
        backgroundColor: COLORS.InactiveText,
        borderRadius: 4,
        marginBottom: 10,
    },
    skeletonContent: {
        height: 60,
        backgroundColor: COLORS.InactiveText,
        borderRadius: 4,
    },
});

/** -----------------------------
 * SkeletonPostItem Component
 ----------------------------- */
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
 * FeedChannelScreen Component
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

    // Use custom hook to fetch feed posts
    const { feedPosts, loadingFeed } = useFeedPosts(channel?.id);

    // Local UI state for creating a post
    const [modalVisible, setModalVisible] = useState(false);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [postAttachments, setPostAttachments] = useState<Attachment[]>([]);

    // Use custom hook for creating a post
    const { createPost, creatingPost } = useCreatePost(channel?.id, () => {
        setModalVisible(false);
        setNewPostTitle('');
        setNewPostContent('');
        setPostAttachments([]); // Clear attachments on success
    });

    const handleCreatePost = async () => {
        if (!channel || !user?.id || creatingPost) return;
        await createPost({
            postedByUserId: user.id,
            channelId: channel.id,
            content: newPostContent,
            title: newPostTitle,
            attachments: postAttachments.map((att) => att.file),
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

            {loadingFeed ? (
                <FlatList
                    style={{ flex: 1 }}
                    data={[0, 1, 2, 3, 4]} // 5 skeleton items
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
                    keyExtractor={(item: FeedPost) => item.id}
                    renderItem={({ item }: { item: FeedPost }) => (
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
                                })
                            }
                            fromReddit={item.fromReddit}
                            attachmentUrls={item.attachmentUrls}
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
                attachments={postAttachments}
                setAttachments={setPostAttachments}
                enableImageAttachments
            />
        </SafeAreaView>
    );
};
