// FeedChannelScreen.tsx
import React, { useState, useMemo } from 'react';
import {
    SafeAreaView,
    FlatList,
    StyleSheet,
    useWindowDimensions,
    Platform,
    View,
} from 'react-native';

import { useTheme, Theme } from '../theme';
import { Header, PostItem } from '../sections';
import { CreateContentButton } from '../buttons';
import { useAppSelector, RootState, UserType } from '../redux';
import { FeedPost, Attachment, GroupChannel } from '../types';
import {
    useFeedPosts,
    useCreatePost,
    useNexusRouter,
    // createNexusParam,
} from '../hooks';
import { CreatePostModal } from '../small-components';
import { detectEnvironment } from '../utils';
import {
    BorderRadius,
    Spacing,
    Typography,
    Opacity,
} from '../constants/designSystem';

// Create a hook to read our screen parameters.
// const { useParam } = createNexusParam<{ channelId: string }>();

const BOTTOM_INPUT_HEIGHT = Spacing.XXXL + Spacing.SM;

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flex: 1,
            flexBasis: 0,
            backgroundColor: theme.colors.SecondaryBackground,
        },
        feedList: {
            paddingHorizontal: Spacing.XL,
            paddingTop: Spacing.LG,
            paddingBottom: BOTTOM_INPUT_HEIGHT,
            gap: Spacing.LG,
        },
        skeletonContainer: {
            backgroundColor: theme.colors.PrimaryBackground,
            padding: Spacing.XL,
            borderRadius: BorderRadius.ExtraSmall,
            shadowColor: theme.colors.ActiveText,
            shadowOpacity: Opacity.BorderMedium,
            shadowRadius: BorderRadius.ExtraSmall,
            elevation: 2,
        },
        skeletonHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: Spacing.MD,
        },
        skeletonAvatar: {
            width: Spacing.XXXL + Spacing.SM,
            height: Spacing.XXXL + Spacing.SM,
            borderRadius: BorderRadius.XL,
            backgroundColor: toRgba(
                theme.colors.InactiveText,
                Opacity.BorderMedium
            ),
        },
        skeletonTextBlock: {
            height: Spacing.LG,
            backgroundColor: toRgba(
                theme.colors.InactiveText,
                Opacity.BorderMedium
            ),
            borderRadius: BorderRadius.ExtraSmall,
            marginLeft: Spacing.MD,
            flex: 1,
        },
        skeletonTitle: {
            height: Spacing.LG,
            backgroundColor: toRgba(
                theme.colors.InactiveText,
                Opacity.BorderMedium
            ),
            borderRadius: BorderRadius.ExtraSmall,
            marginBottom: Spacing.MD,
        },
        skeletonContent: {
            height: Spacing.XXXL,
            backgroundColor: toRgba(
                theme.colors.InactiveText,
                Opacity.BorderMedium
            ),
            borderRadius: BorderRadius.ExtraSmall,
        },
        createContentButtonContainer: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: BOTTOM_INPUT_HEIGHT,
            paddingHorizontal: Spacing.XL,
            paddingTop: Spacing.MD,
            backgroundColor: theme.colors.SecondaryBackground,
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
                            onPress={() => {
                                if (
                                    detectEnvironment() === 'nextjs-client' ||
                                    detectEnvironment() === 'nextjs-server'
                                ) {
                                    push(`/post/${item.id}`);
                                } else {
                                    push('post', { id: item.id });
                                }
                            }}
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
