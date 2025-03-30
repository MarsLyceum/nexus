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

import { Header, PostItem } from '../sections';
import { COLORS } from '../constants';
import { CreateContentButton } from '../buttons';
import { useAppSelector, RootState, UserType } from '../redux';
import { FeedPost, Attachment, GroupChannel } from '../types';
import {
    useFeedPosts,
    useCreatePost,
    useNexusRouter,
    createNexusParam,
} from '../hooks';
import { CreatePostModal } from '../small-components';

// Create a hook to read our screen parameters.
const { useParam } = createNexusParam<{ channelId: string }>();

const BOTTOM_INPUT_HEIGHT = 60;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexBasis: 0,
        backgroundColor: COLORS.SecondaryBackground,
    },
    feedList: {
        padding: 15,
        paddingBottom: BOTTOM_INPUT_HEIGHT,
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
    createContentButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: BOTTOM_INPUT_HEIGHT,
    },
});

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

interface FeedChannelScreenProps {
    channel?: GroupChannel;
}

export const FeedChannelScreen: React.FC<FeedChannelScreenProps> = ({
    channel: channelProp,
}) => {
    // Get the channel from URL params if not provided as a prop.
    const [channelFromParam] = useParam('channelId');
    const channel = channelProp || channelFromParam;

    const user: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );
    const { width } = useWindowDimensions();
    const { push } = useNexusRouter(); // Use router push for navigation

    // Fetch feed posts using a custom hook
    const { feedPosts, loadingFeed } = useFeedPosts(channel?.id);

    // Local UI state for creating a post
    const [modalVisible, setModalVisible] = useState(false);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [postAttachments, setPostAttachments] = useState<Attachment[]>([]);

    // Hook for creating a post
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

    // Determine if we're on desktop (web)
    const isDesktop = Platform.OS === 'web' && width > 768;

    return (
        <SafeAreaView
            style={[styles.container, isDesktop ? { paddingBottom: 60 } : {}]}
        >
            <Header
                isLargeScreen={width > 768}
                headerText={channel?.name ?? ''}
            />

            {loadingFeed ? (
                <FlatList
                    style={{ flex: 1, flexBasis: 0 }}
                    data={[0, 1, 2, 3, 4]} // Render 5 skeleton items while loading
                    keyExtractor={(item) => item.toString()}
                    renderItem={() => <SkeletonPostItem />}
                    contentContainerStyle={[styles.feedList]}
                />
            ) : (
                <FlatList
                    style={{ flex: 1, flexBasis: 0 }}
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
                            // Navigate using the push function from useRouter
                            onPress={() => push(`/post/${item.id}`)}
                            attachmentUrls={item.attachmentUrls}
                        />
                    )}
                    contentContainerStyle={[styles.feedList]}
                />
            )}

            <View style={styles.createContentButtonContainer}>
                <CreateContentButton
                    buttonText="Create a new post"
                    onPress={() => setModalVisible(true)}
                />
            </View>

            <CreatePostModal
                modalVisible={modalVisible}
                setModalVisible={setModalVisible}
                contentText={newPostTitle}
                setContentText={setNewPostTitle}
                secondContentText={newPostContent}
                setSecondContentText={setNewPostContent}
                handleCreate={handleCreatePost}
                buttonText="Create a new post"
                modalTitle="Create New Post"
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
