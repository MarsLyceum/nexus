import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { NexusImage } from '../NexusImage';
import { LinkPreview } from '../LinkPreview';
import { MarkdownRenderer } from '../MarkdownRenderer';
import {
    extractUrls,
    isImageExtensionUrl,
    computeMediaSize,
} from '../../utils';
import { useMediaTypes, useLinkPreview } from '../../hooks';
import { NexusVideo } from '../NexusVideo';
import type { MessageWithAvatar, DirectMessageWithAvatar } from '../../types';

export type MessageContentProps = {
    message: MessageWithAvatar | DirectMessageWithAvatar;
    width: number;
    onAttachmentPress: (attachments: string[], index: number) => void;
    // New props for selective rendering
    renderMessage?: boolean;
    renderLinkPreview?: boolean;
    renderAttachments?: boolean;
    contentOverride?: string; // For live preview during editing
};

export const MessageContent: React.FC<MessageContentProps> = ({
    message,
    width,
    onAttachmentPress,
    renderMessage = true,
    renderLinkPreview = true,
    renderAttachments = true,
    contentOverride = undefined,
}) => {
    const mediaInfos = useMediaTypes(message.attachmentUrls || []);

    // Use override content if provided, otherwise use message content
    const effectiveContent = contentOverride ?? message.content;

    // Determine if the effective content is just a link.
    const trimmedContent = effectiveContent?.trim();
    const urls = extractUrls(trimmedContent ?? '');
    const { previewData, isImage } = useLinkPreview({
        url: urls[0],
    });
    const isJustImageOrEmbeddLink =
        urls.length === 1 &&
        trimmedContent === urls[0] &&
        (isImage || previewData.embedHtml);

    // Helper to render the message text using MarkdownRenderer.
    // Updated to pass the isEdited prop.
    const renderMessageText = (content: string, isEdited: boolean) => (
        <MarkdownRenderer text={content} isEdited={isEdited} />
    );

    // Helper to render link previews based on content URLs or previewData
    const renderLinkPreviews = (content: string, messageWidth: number) => {
        const trimmedContentInner = content.trim();
        const urlsInner = extractUrls(trimmedContentInner);

        if (
            urlsInner.length === 1 &&
            trimmedContentInner === urlsInner[0] &&
            isImageExtensionUrl(urlsInner[0])
        ) {
            return (
                <LinkPreview
                    url={urlsInner[0]}
                    containerWidth={messageWidth - 32}
                />
            );
        }

        if (urlsInner.length > 0) {
            return (
                <>
                    {urlsInner.map((url, index) => (
                        <LinkPreview
                            key={index}
                            url={url}
                            containerWidth={messageWidth - 32}
                        />
                    ))}
                </>
            );
        }

        return undefined;
    };

    const [attachmentContainerWidth, setAttachmentContainerWidth] =
        useState<number>(300);

    return (
        <View style={styles.messageContent}>
            {effectiveContent ? (
                <>
                    {renderMessage &&
                        !isJustImageOrEmbeddLink &&
                        renderMessageText(effectiveContent, message.edited)}

                    {renderLinkPreview &&
                        renderLinkPreviews(effectiveContent, width)}
                </>
            ) : (
                <></>
            )}

            {/* Only render attachments if requested and attachments exist */}
            {renderAttachments &&
                message.attachmentUrls &&
                message.attachmentUrls.length > 0 && (
                    <View
                        style={styles.messageAttachmentsContainer}
                        onLayout={(e) => {
                            const layoutWidth = e.nativeEvent.layout.width;
                            if (
                                layoutWidth &&
                                layoutWidth !== attachmentContainerWidth
                            ) {
                                setAttachmentContainerWidth(layoutWidth);
                            }
                        }}
                    >
                        {message.attachmentUrls.map((url, index) => {
                            const info = mediaInfos[url];

                            const computedSize = computeMediaSize(
                                info?.aspectRatio,
                                attachmentContainerWidth
                            );

                            return (
                                <View key={index}>
                                    {info && info.type === 'video' ? (
                                        <NexusVideo
                                            source={{ uri: url }}
                                            style={[
                                                styles.messageAttachmentImage,
                                                {
                                                    width: computedSize.width,
                                                    height: computedSize.height,
                                                },
                                            ]}
                                            muted={false}
                                            repeat
                                            paused
                                            contentFit="cover"
                                        />
                                    ) : info && info.type === 'image' ? (
                                        <TouchableOpacity
                                            onPress={() =>
                                                onAttachmentPress(
                                                    message.attachmentUrls ??
                                                        [],
                                                    index
                                                )
                                            }
                                        >
                                            <NexusImage
                                                source={url}
                                                style={{
                                                    ...styles.messageAttachmentImage,
                                                }}
                                                contentFit="cover"
                                                width={computedSize.width}
                                                height={computedSize.height}
                                                alt="Message attachment image"
                                            />
                                        </TouchableOpacity>
                                    ) : undefined}
                                </View>
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
