import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { GestureDetector, NativeGesture } from 'react-native-gesture-handler';
import { NexusImage } from '../NexusImage';
import { LinkPreview } from '../LinkPreview';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { extractUrls, computeMediaSize } from '../../utils';
import { useMediaTypes, useLinkPreview } from '../../hooks';
import { NexusVideo } from '../NexusVideo';
import type { MessageWithAvatar, DirectMessageWithAvatar } from '../../types';

export type MessageContentProps = {
    message: MessageWithAvatar | DirectMessageWithAvatar;
    width: number;
    videoGesture?: NativeGesture;
    sliderGesture?: NativeGesture;
    onAttachmentPress: (attachments: string[], index: number) => void;
    // New props for selective rendering
    renderMessage?: boolean;
    renderLinkPreview?: boolean;
    renderAttachments?: boolean;
    contentOverride?: string; // For live preview during editing
};

function MessageContentComponent({
    message,
    width,
    onAttachmentPress,
    videoGesture,
    sliderGesture,
    renderMessage = true,
    renderLinkPreview = true,
    renderAttachments = true,
    contentOverride = undefined,
}: Readonly<MessageContentProps>) {
    const mediaInfos = useMediaTypes(message.attachmentUrls || []);

    // Use override content if provided, otherwise use message content
    const effectiveContent = contentOverride ?? message.content;

    // Determine if the effective content is just a link.
    const trimmedContent = effectiveContent?.trim();
    const urls = extractUrls(trimmedContent ?? '');
    const { previewData, isImage } = useLinkPreview({
        url: urls[0],
    });
    const isMarkdownPreview = message.isDraft === true;
    const isJustImageOrEmbeddLink =
        urls.length === 1 &&
        trimmedContent === urls[0] &&
        (isImage || previewData.embedHtml);

    const [attachmentContainerWidth, setAttachmentContainerWidth] =
        useState<number>(300);

    const renderMedia = useCallback(
        (
            url: string,
            info: { type: string; aspectRatio?: number } | undefined,
            computedSize: { width: number; height: number }
        ) => {
            if (!info) return undefined;

            if (info.type === 'video') {
                const videoElement = (
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
                        controls
                        contentFit="cover"
                        sliderGesture={sliderGesture}
                    />
                );

                return videoGesture ? (
                    <GestureDetector gesture={videoGesture}>
                        <View style={styles.videoContainer}>
                            {videoElement}
                        </View>
                    </GestureDetector>
                ) : (
                    videoElement
                );
            }

            if (info.type === 'image') {
                return (
                    <NexusImage
                        source={url}
                        style={styles.messageAttachmentImage}
                        contentFit="cover"
                        width={computedSize.width}
                        height={computedSize.height}
                        alt="Message attachment image"
                    />
                );
            }

            return undefined;
        },
        [videoGesture, sliderGesture]
    );

    return (
        <View style={styles.messageContent}>
            {effectiveContent ? (
                <>
                    {renderMessage && !isJustImageOrEmbeddLink && (
                        <MarkdownRenderer
                            text={effectiveContent}
                            preview={isMarkdownPreview}
                            isEdited={message.edited}
                        />
                    )}

                    {renderLinkPreview && urls.length > 0 && (
                        <>
                            {urls.map((url, index) => (
                                <LinkPreview
                                    key={index}
                                    url={url}
                                    containerWidth={width - 32}
                                />
                            ))}
                        </>
                    )}
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
                                <TouchableOpacity
                                    onPress={() =>
                                        onAttachmentPress(
                                            message.attachmentUrls ?? [],
                                            index
                                        )
                                    }
                                    key={index}
                                >
                                    <View>
                                        {renderMedia(url, info, computedSize)}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
        </View>
    );
}

const arePropsEqual = (
    prev: Readonly<MessageContentProps>,
    next: Readonly<MessageContentProps>
): boolean => {
    const messageEqual =
        prev.message.id === next.message.id &&
        prev.message.content === next.message.content &&
        prev.message.edited === next.message.edited &&
        prev.message.attachmentUrls === next.message.attachmentUrls;

    const otherPropsEqual =
        prev.width === next.width &&
        prev.contentOverride === next.contentOverride;

    return messageEqual && otherPropsEqual;
};

export const MessageContent = React.memo(
    MessageContentComponent,
    arePropsEqual
);

const styles = StyleSheet.create({
    messageContent: {
        flex: 1,
        flexShrink: 1,
    },
    videoContainer: {
        flex: 1,
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
