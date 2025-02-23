import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image as RNImage,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinkPreview } from './LinkPreview';
import { MessageWithAvatar } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { extractUrls } from '../utils';

const formatDateTime = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours() % 12 || 12;
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
};

export type MessageItemProps = {
    item: MessageWithAvatar;
    width: number;
    onAttachmentPress: (attachments: string[], index: number) => void;
};

// This component renders an attachment image at 30% of its native size.
const NativeSizeAttachmentImage: React.FC<{ uri: string }> = ({ uri }) => {
    const [dimensions, setDimensions] = React.useState<
        { width: number; height: number } | undefined
    >();

    React.useEffect(() => {
        RNImage.getSize(
            uri,
            (width, height) => setDimensions({ width, height }),
            (error) =>
                console.error('Failed to get image dimensions for', uri, error)
        );
    }, [uri]);

    if (!dimensions) {
        // Optionally, you can return a placeholder or spinner while dimensions load.
        return null;
    }

    return (
        <ExpoImage
            source={{ uri }}
            style={[
                styles.messageAttachmentImage,
                {
                    width: dimensions.width * 0.3,
                    height: dimensions.height * 0.3,
                },
            ]}
            contentFit="contain"
        />
    );
};

// Updated renderMessageContent function
// - First, trim the content to remove extra whitespace.
// - Extract URLs from the trimmed content.
// - If there is a single URL and the trimmed content is exactly that URL, only render the LinkPreview.
// - Otherwise, render the markdown and any link previews.
const renderMessageContent = (content: string, width: number) => {
    const trimmedContent = content.trim();
    const urls = extractUrls(trimmedContent);

    if (urls.length === 1 && trimmedContent === urls[0]) {
        return <LinkPreview url={urls[0]} containerWidth={width - 32} />;
    }

    if (urls.length > 0) {
        return (
            <>
                <MarkdownRenderer text={content} />
                {urls.map((url, index) => (
                    <LinkPreview
                        url={url}
                        key={index}
                        containerWidth={width - 32}
                    />
                ))}
            </>
        );
    }
    return <MarkdownRenderer text={content} />;
};

export const MessageItem: React.FC<MessageItemProps> = ({
    item,
    width,
    onAttachmentPress,
}) => (
    <View style={styles.messageContainer}>
        <ExpoImage source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.messageContent}>
            <Text style={styles.userName}>
                {item.username}{' '}
                <Text style={styles.time}>{formatDateTime(item.postedAt)}</Text>
            </Text>
            {item.content ? renderMessageContent(item.content, width) : null}
            {item.attachmentUrls && item.attachmentUrls.length > 0 && (
                <View style={styles.messageAttachmentsContainer}>
                    {item.attachmentUrls.map((url, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() =>
                                onAttachmentPress(
                                    item.attachmentUrls ?? [],
                                    index
                                )
                            }
                        >
                            <NativeSizeAttachmentImage uri={url} />
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    </View>
);

const styles = StyleSheet.create({
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 15,
        width: '100%',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    messageContent: {
        flex: 1,
        flexShrink: 1,
    },
    userName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'white',
        fontFamily: 'Roboto_700Bold',
    },
    time: {
        fontSize: 12,
        color: 'gray',
    },
    messageText: {
        fontSize: 14,
        color: 'white',
        marginTop: 2,
        flexWrap: 'wrap',
        flexShrink: 1,
        fontFamily: 'Roboto_400Regular',
    },
    messageAttachmentsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 5,
    },
    messageAttachmentImage: {
        marginRight: 5,
        marginTop: 5,
        borderRadius: 8,
    },
});
