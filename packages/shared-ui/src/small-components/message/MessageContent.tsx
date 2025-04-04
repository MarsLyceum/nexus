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
    item: MessageWithAvatar | DirectMessageWithAvatar;
    width: number;
    onAttachmentPress: (attachments: string[], index: number) => void;
};

export const MessageContent: React.FC<MessageContentProps> = ({
    item,
    width,
    onAttachmentPress,
}) => {
    const mediaInfos = useMediaTypes(item.attachmentUrls || []);

    // Helper to render the message text, markdown, and any link previews.
    const renderMessageContent = (
        content: string,
        width: number,
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

    return (
        <View style={styles.messageContent}>
            {item.content
                ? renderMessageContent(item.content, width, item.previewData)
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
