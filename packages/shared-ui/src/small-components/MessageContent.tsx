import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { GestureDetector, NativeGesture } from 'react-native-gesture-handler';
import { NexusImage } from './NexusImage';
import { LinkPreview } from './LinkPreview';
import { MarkdownRenderer } from './MarkdownRenderer';
import {
    extractUrls,
    isImageExtensionUrl,
    computeMediaSize,
    isJustLink,
} from '../utils';
import { useMediaTypes, useLinkPreview, useIsComputer } from '../hooks';
import { NexusVideo } from './NexusVideo';
import type { MessageWithAvatar, DirectMessageWithAvatar } from '../types';

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

export const MessageContent: React.FC<MessageContentProps> = ({
    message,
    width,
    onAttachmentPress,
    videoGesture,
    sliderGesture,
    renderMessage = true,
    renderLinkPreview = true,
    renderAttachments = true,
    contentOverride = undefined,
}) => {
    const mediaInfos = useMediaTypes(message.attachmentUrls || []);
    const isComputer = useIsComputer();

    // Use override content if provided, otherwise use message content
    const effectiveContent = contentOverride ?? message.content;

    // Helper to render the message text using MarkdownRenderer.
    // Updated to pass the isEdited prop.
    const renderMessageText = (
        content: string,
        isEdited: boolean,
        messageWidth: number
    ) => (
        <MarkdownRenderer
            text={content}
            isEdited={isEdited}
            containerWidth={messageWidth - 32}
        />
    );

    // Helper to render link previews based on content URLs or previewData
    const renderLinkPreviews = (content: string, messageWidth: number) => {
        const trimmedContentInner = content.trim();
        const urlsInner = extractUrls(trimmedContentInner);

        if (urlsInner.length > 0) {
            return (
                <>
                    {urlsInner.map((url, index) => (
                        <LinkPreview
                            key={index}
                            url={url}
                            containerWidth={messageWidth - 32}
                            renderImages={false}
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
                        renderMessageText(
                            effectiveContent,
                            message.edited,
                            width
                        )}

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
                                <TouchableOpacity
                                    onPress={() => {
                                        if (
                                            info &&
                                            (info.type !== 'video' ||
                                                !isComputer)
                                        ) {
                                            onAttachmentPress(
                                                message.attachmentUrls ?? [],
                                                index
                                            );
                                        }
                                    }}
                                    key={index}
                                >
                                    <View>
                                        {info && info.type === 'video' ? (
                                            videoGesture ? (
                                                <GestureDetector
                                                    gesture={videoGesture}
                                                >
                                                    <View
                                                        style={
                                                            styles.videoContainer
                                                        }
                                                    >
                                                        <NexusVideo
                                                            source={{
                                                                uri: url,
                                                            }}
                                                            style={[
                                                                styles.messageAttachmentImage,
                                                                {
                                                                    width: computedSize.width,
                                                                    height: computedSize.height,
                                                                },
                                                            ]}
                                                            muted={false}
                                                            paused
                                                            contentFit="cover"
                                                            controls
                                                            sliderGesture={
                                                                sliderGesture
                                                            }
                                                        />
                                                    </View>
                                                </GestureDetector>
                                            ) : (
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
                                                    paused
                                                    controls
                                                    contentFit="cover"
                                                    sliderGesture={
                                                        sliderGesture
                                                    }
                                                />
                                            )
                                        ) : info && info.type === 'image' ? (
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
                                        ) : undefined}
                                    </View>
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
