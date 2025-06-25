// DeletePostConfirmationModal.tsx
import React, { useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    useWindowDimensions,
} from 'react-native';
import { useTheme, Theme } from '../theme';
import { FeedPost } from '../types';
import { extractUrls } from '../utils';
import { NexusImage } from './NexusImage';
import { MarkdownRenderer } from './MarkdownRenderer';
import { LinkPreview } from './LinkPreview';
import { AttachmentImageGallery } from '../sections/AttachmentImageGallery';
import { MiniModal } from './MiniModal';

export type DeletePostConfirmationModalProps = {
    visible: boolean;
    onClose: () => void;
    onConfirmDelete: () => void;
    post: FeedPost;
    group?: string;
    onAttachmentPress: (index: number) => void;
};

export const DeletePostConfirmationModal = ({
    visible,
    onClose,
    onConfirmDelete,
    post,
    group,
    onAttachmentPress,
}: DeletePostConfirmationModalProps) => {
    const { width: vpWidth, height: vpHeight } = useWindowDimensions();
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const modalWidth = useMemo(() => {
        const SAFE = 32;
        const MAX = 480;
        return Math.min(MAX, vpWidth - SAFE);
    }, [vpWidth]);

    const previewMaxHeight = useMemo(
        () => Math.min(vpHeight * 0.5, 300),
        [vpHeight]
    );

    const urls = extractUrls(post.content);

    return (
        <MiniModal
            visible={visible}
            onClose={onClose}
            centered
            closeOnOutsideClick
            containerStyle={[styles.modalContainer, { width: modalWidth }]}
        >
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Delete Post</Text>
            </View>

            <View style={styles.body}>
                <Text style={styles.bodyText}>
                    Are you sure you want to delete this post?
                </Text>

                <ScrollView
                    style={[
                        styles.previewContainer,
                        { maxHeight: previewMaxHeight },
                    ]}
                    contentContainerStyle={{ flexGrow: 1 }}
                >
                    <View style={styles.metaRow}>
                        <NexusImage
                            source={post.thumbnail || post.username}
                            style={styles.avatar}
                            width={36}
                            height={36}
                            alt="Author avatar"
                        />
                        <View style={styles.metaText}>
                            {group && (
                                <Text style={styles.groupText}>{group}</Text>
                            )}
                            <Text style={styles.authorText}>
                                {post.username}{' '}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.contentBlock}>
                        <MarkdownRenderer text={post.title} isTitle />
                        {post.flair && (
                            <Text style={styles.flair}>{post.flair}</Text>
                        )}
                        <MarkdownRenderer text={post.content} />
                        {urls.map((u, i) => (
                            <LinkPreview
                                key={i}
                                url={u}
                                containerWidth={modalWidth - 20}
                                renderImages={false}
                            />
                        ))}
                        {post.attachmentUrls &&
                            post.attachmentUrls?.length > 0 && (
                                <AttachmentImageGallery
                                    attachmentUrls={post.attachmentUrls}
                                    onImagePress={onAttachmentPress}
                                    containerWidth={modalWidth - 20}
                                />
                            )}
                    </View>
                </ScrollView>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={onConfirmDelete}
                    style={styles.deleteBtn}
                >
                    <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </MiniModal>
    );
};

function createStyles(theme: Theme) {
    return StyleSheet.create({
        modalContainer: {
            backgroundColor: theme.colors.PrimaryBackground,
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
        },
        header: {
            marginBottom: 12,
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.ActiveText,
        },
        body: {
            marginBottom: 16,
        },
        bodyText: {
            fontSize: 14,
            color: theme.colors.MainText,
            marginBottom: 12,
        },
        previewContainer: {
            backgroundColor: theme.colors.SecondaryBackground,
            borderRadius: 4,
            padding: 10,
            marginBottom: 16,
        },
        metaRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
        },
        avatar: {
            borderRadius: 18,
            marginRight: 10,
        },
        metaText: {
            flex: 1,
        },
        groupText: {
            fontSize: 12,
            fontWeight: '600',
            color: theme.colors.Primary,
        },
        authorText: {
            fontSize: 14,
            fontWeight: 'bold',
            color: theme.colors.ActiveText,
        },
        timeText: {
            fontSize: 12,
            color: theme.colors.InactiveText,
        },
        contentBlock: {
            marginTop: 8,
        },
        flair: {
            alignSelf: 'flex-start',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 10,
            backgroundColor: theme.colors.Primary,
            color: theme.colors.ActiveText,
            marginVertical: 6,
        },
        footer: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
        },
        cancelBtn: {
            paddingVertical: 8,
            paddingHorizontal: 16,
            marginRight: 8,
            borderRadius: 4,
        },
        cancelText: {
            fontSize: 14,
            color: theme.colors.InactiveText,
        },
        deleteBtn: {
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 4,
            backgroundColor: theme.colors.Error,
        },
        deleteText: {
            fontSize: 14,
            fontWeight: 'bold',
            color: theme.colors.ActiveText,
        },
    });
}
