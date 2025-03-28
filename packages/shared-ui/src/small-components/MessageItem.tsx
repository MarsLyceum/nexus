import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image as RNImage,
} from 'react-native';
import { SolitoImage } from 'solito/image';
import { LinkPreview } from './LinkPreview';
import { MessageWithAvatar, PreviewData } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { extractUrls, formatDateForChat, isImageExtensionUrl } from '../utils';
import { useMediaTypes } from '../hooks/useMediaTypes';
import { NexusVideo } from '.';

export type MessageItemProps = {
    item: MessageWithAvatar;
    width: number;
    onAttachmentPress: (attachments: string[], index: number) => void;
};

// This component renders an image attachment at 50% of its native size.
const NativeSizeAttachmentImage: React.FC<{ uri: string }> = ({ uri }) => {
    const [dimensions, setDimensions] = React.useState<
        { width: number; height: number } | undefined
    >(undefined);

    React.useEffect(() => {
        RNImage.getSize(
            uri,
            (width, height) => setDimensions({ width, height }),
            (error) =>
                console.error(
                    'Failed to get image dimensions for image in message',
                    uri,
                    error
                )
        );
    }, [uri]);

    if (!dimensions) {
        return null;
    }

    const scaledWidth = dimensions.width * 0.5;
    const scaledHeight = dimensions.height * 0.5;

    return (
        <SolitoImage
            src={uri}
            style={{
                ...styles.messageAttachmentImage,
                width: scaledWidth,
                height: scaledHeight,
            }}
            contentFit="contain"
            width={scaledWidth}
            height={scaledHeight}
            alt="Message attachment image"
        />
    );
};

// This component renders a video attachment using NexusVideo.
// It uses the native width and height from the media info and scales them by 50%.
const NativeSizeAttachmentVideo: React.FC<{
    uri: string;
    nativeWidth: number;
    nativeHeight: number;
    aspectRatio: number;
}> = ({ uri, nativeWidth, nativeHeight }) => {
    const scaledWidth = nativeWidth * 0.5;
    const scaledHeight = nativeHeight * 0.5;

    return (
        <NexusVideo
            source={{ uri }}
            style={[
                styles.messageAttachmentImage,
                { width: scaledWidth, height: scaledHeight },
            ]}
            muted={false}
            repeat
            paused
            contentFit="contain"
        />
    );
};

const renderMessageContent = (
    content: string,
    width: number,
    previewData?: PreviewData[]
) => {
    const trimmedContent = content.trim();
    const urls = extractUrls(trimmedContent);

    // If preview data is provided, use that.
    if (previewData && previewData.length > 0) {
        if (
            previewData.length === 1 &&
            trimmedContent === previewData[0].url &&
            isImageExtensionUrl(previewData[0].url)
        ) {
            return (
                <LinkPreview
                    previewData={previewData[0]}
                    containerWidth={width - 32}
                />
            );
        }

        return (
            <>
                <MarkdownRenderer text={content} />
                {previewData.map((pd, index) => (
                    <LinkPreview
                        key={index}
                        previewData={pd}
                        containerWidth={width - 32}
                    />
                ))}
            </>
        );
    }

    if (
        urls.length === 1 &&
        trimmedContent === urls[0] &&
        isImageExtensionUrl(urls[0])
    ) {
        return <LinkPreview url={urls[0]} containerWidth={width - 32} />;
    }

    if (urls.length > 0) {
        return (
            <>
                <MarkdownRenderer text={content} />
                {urls.map((url, index) => (
                    <LinkPreview
                        key={index}
                        url={url}
                        containerWidth={width - 32}
                    />
                ))}
            </>
        );
    }

    return <MarkdownRenderer text={content} />;
};

const MessageItemComponent: React.FC<MessageItemProps> = ({
    item,
    width,
    onAttachmentPress,
}) => {
    const mediaInfos = useMediaTypes(item.attachmentUrls || []);

    return (
        <View style={styles.messageContainer}>
            <SolitoImage
                src={item.avatar}
                style={styles.avatar}
                width={40}
                height={40}
                alt="User avatar"
            />
            <View style={styles.messageContent}>
                <Text style={styles.userName}>
                    {item.username}{' '}
                    <Text style={styles.time}>
                        {formatDateForChat(item.postedAt)}
                    </Text>
                </Text>
                {item.content
                    ? renderMessageContent(
                          item.content,
                          width,
                          item.previewData
                      )
                    : null}
                {item.attachmentUrls && item.attachmentUrls.length > 0 && (
                    <View style={styles.messageAttachmentsContainer}>
                        {item.attachmentUrls.map((url, index) => {
                            const info = mediaInfos[url];
                            return (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() =>
                                        onAttachmentPress(
                                            item.attachmentUrls ?? [],
                                            index
                                        )
                                    }
                                >
                                    {info && info.type === 'video' ? (
                                        <NativeSizeAttachmentVideo
                                            uri={url}
                                            nativeWidth={info.width}
                                            nativeHeight={info.height}
                                            aspectRatio={info.aspectRatio}
                                        />
                                    ) : info && info.type === 'image' ? (
                                        <NativeSizeAttachmentImage uri={url} />
                                    ) : null}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </View>
        </View>
    );
};

export const MessageItem = React.memo(MessageItemComponent);

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
        fontFamily: 'Roboto_400Regular',
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
