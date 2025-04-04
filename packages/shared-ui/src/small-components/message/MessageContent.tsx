import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { NexusImage } from '../NexusImage';
import { LinkPreview } from '../LinkPreview';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { extractUrls, isImageExtensionUrl } from '../../utils';
import { useMediaTypes } from '../../hooks';
import { NexusVideo } from '../NexusVideo';
import type {
    MessageWithAvatar,
    DirectMessageWithAvatar,
    PreviewData,
} from '../../types';

export type MessageContentProps = {
    message: MessageWithAvatar | DirectMessageWithAvatar;
    width: number;
    onAttachmentPress: (attachments: string[], index: number) => void;
    // New props for selective rendering
    renderContent?: boolean;
    renderAttachments?: boolean;
    contentOverride?: string | null; // For live preview during editing
};

export const MessageContent: React.FC<MessageContentProps> = ({
    message,
    width,
    onAttachmentPress,
    renderContent = true,
    renderAttachments = true,
    contentOverride = null,
}) => {
    const mediaInfos = useMediaTypes(message.attachmentUrls || []);

    // Use override content if provided, otherwise use message content
    const effectiveContent =
        contentOverride !== null ? contentOverride : message.content;

    // Helper to render the message text, markdown, and any link previews.
    const renderMessageContent = (
        content: string,
        messageWidth: number,
        previewData?: PreviewData[]
    ) => {
        const trimmedContent = content.trim();
        const urls = extractUrls(trimmedContent);

        if (previewData && previewData.length > 0) {
            if (
                previewData.length === 1 &&
                trimmedContent === previewData[0].url &&
                isImageExtensionUrl(previewData[0].url)
            ) {
                return (
                    <LinkPreview
                        previewData={previewData[0]}
                        containerWidth={messageWidth - 32}
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
                            containerWidth={messageWidth - 32}
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
            return (
                <LinkPreview url={urls[0]} containerWidth={messageWidth - 32} />
            );
        }

        if (urls.length > 0) {
            return (
                <>
                    <MarkdownRenderer text={content} />
                    {urls.map((url, index) => (
                        <LinkPreview
                            key={index}
                            url={url}
                            containerWidth={messageWidth - 32}
                        />
                    ))}
                </>
            );
        }

        return <MarkdownRenderer text={content} />;
    };

    return (
        <View style={styles.messageContent}>
            {/* Only render content if requested and content exists */}
            {renderContent && effectiveContent
                ? renderMessageContent(effectiveContent, width)
                : null}

            {/* Only render attachments if requested and attachments exist */}
            {renderAttachments &&
                message.attachmentUrls &&
                message.attachmentUrls.length > 0 && (
                    <View style={styles.messageAttachmentsContainer}>
                        {message.attachmentUrls.map((url, index) => {
                            const info = mediaInfos[url];
                            return (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() =>
                                        onAttachmentPress(
                                            message.attachmentUrls ?? [],
                                            index
                                        )
                                    }
                                >
                                    {info && info.type === 'video' ? (
                                        <NexusVideo
                                            source={{ uri: url }}
                                            style={[
                                                styles.messageAttachmentImage,
                                                {
                                                    width: info.width * 0.5,
                                                    height: info.height * 0.5,
                                                },
                                            ]}
                                            muted={false}
                                            repeat
                                            paused
                                            contentFit="contain"
                                        />
                                    ) : info && info.type === 'image' ? (
                                        <NexusImage
                                            source={url}
                                            style={{
                                                ...styles.messageAttachmentImage,
                                                width: info.width * 0.5,
                                                height: info.height * 0.5,
                                            }}
                                            contentFit="contain"
                                            width={info.width * 0.5}
                                            height={info.height * 0.5}
                                            alt="Message attachment image"
                                        />
                                    ) : null}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
        </View>
    );
};

const styles = StyleSheet.create({
    messageContent: {
        flex: 1,
        flexShrink: 1,
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
