// FeedChannelScreen.tsx
import React, { useState, useMemo } from 'react';
import {
    SafeAreaView,
    FlatList,
    StyleSheet,
    useWindowDimensions,
    Platform,
    View,
    Text,
} from 'react-native';

import { useTheme, Theme } from '../theme';
import { Header, PostItem } from '../sections';
import { useAppSelector, RootState, UserType } from '../redux';
import { FeedPost, Attachment, GroupChannel } from '../types';
import { useFeedPosts, useCreatePost, useNexusRouter } from '../hooks';
import { CreatePostModal, ActionButton } from '../small-components';
import { detectEnvironment } from '../utils';
import { Add } from '../icons';

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flex: 1,
            flexBasis: 0,
            backgroundColor: theme.colors.SecondaryBackground,
        },
        feedList: {
            padding: 15,
        },
        skeletonContainer: {
            backgroundColor: theme.colors.PrimaryBackground,
            padding: 15,
            marginBottom: 10,
            borderRadius: 8,
            shadowColor: theme.colors.ActiveText,
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
            backgroundColor: theme.colors.InactiveText,
        },
        skeletonTextBlock: {
            height: 20,
            backgroundColor: theme.colors.InactiveText,
            borderRadius: 4,
            marginLeft: 10,
            flex: 1,
        },
        skeletonTitle: {
            height: 20,
            backgroundColor: theme.colors.InactiveText,
            borderRadius: 4,
            marginBottom: 10,
        },
        skeletonContent: {
            height: 60,
            backgroundColor: theme.colors.InactiveText,
            borderRadius: 4,
        },
        createContentButtonContainer: {
            position: 'absolute',
            right: 0,
        },
    });
}

interface FeedChannelScreenProps {
    channel?: GroupChannel;
}

export const FeedChannelScreen: React.FC<FeedChannelScreenProps> = ({
    channel: channelProp,
}) => {
    // Get the channel from URL params if not provided as a prop.
    // const [channelFromParam] = useParam('channelId');
    const channel = channelProp;
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

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

    const SkeletonPostItem: React.FC = () => (
        <View style={styles.skeletonContainer}>
            <View style={styles.skeletonHeader}>
                <View style={styles.skeletonAvatar} />
                <View style={[styles.skeletonTextBlock, { width: '60%' }]} />
            </View>
            <View style={[styles.skeletonTitle, { width: '80%' }]} />
            <View
                style={[
                    styles.skeletonContent,
                    { width: '100%', marginTop: 10 },
                ]}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Header
                isLargeScreen={width > 768}
                headerText={channel?.name ?? ''}
            >
                <View style={styles.createContentButtonContainer}>
                    <ActionButton
                        onPress={() => setModalVisible(true)}
                        transparent
                    >
                        <Add style={{ marginRight: 10 }} />
                        <Text style={{ color: theme.colors.ActiveText }}>
                            Create new post
                        </Text>
                    </ActionButton>
                </View>
            </Header>

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
                            onPress={() => {
                                push(
                                    '/post',
                                    { id: item.id },
                                    { pathParams: ['id'] }
                                );
                            }}
                            attachmentUrls={item.attachmentUrls}
                        />
                    )}
                    contentContainerStyle={[styles.feedList]}
                />
            )}

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
