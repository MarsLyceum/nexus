import React, { useState, useRef, useMemo } from 'react';
import {
    View,
    TouchableOpacity,
    Platform,
    StyleSheet,
    Text,
} from 'react-native';

import { useTheme, Theme } from '../theme';
import { AttachmentPreviews } from '../sections';
import { Attachment } from '../types';
import { extractUrls } from '../utils';
import { Cancel, ImageIcon, PaperPlane } from '../icons';

import { MarkdownTextInput } from './MarkdownTextInput';
import { NexusImage } from './NexusImage';
import { GiphyModal } from './GiphyModal';

export type ChatInputProps = {
    messageText: string;
    setMessageText: (text: string) => void;
    attachments: Attachment[];
    setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
    handleImageUpload: () => void;
    sendMessageHandler: (overrideMessageText?: string) => void;
    recipientName: string;
    onInlineImagePress: (url: string) => void;
    onAttachmentPreviewPress: (att: Attachment) => void;
};

export const ChatInput: React.FC<ChatInputProps> = ({
    messageText,
    setMessageText,
    attachments,
    setAttachments,
    handleImageUpload,
    sendMessageHandler,
    recipientName,
    onInlineImagePress,
    onAttachmentPreviewPress,
}) => {
    const [showGiphy, setShowGiphy] = useState(false);
    const [gifButtonLayout, setGifButtonLayout] = useState<
        | {
              x: number;
              y: number;
              width: number;
              height: number;
          }
        | undefined
    >();
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    // Create a ref for the GIF button.
    const gifButtonRef = useRef<View>(null);

    // Extract inline image URLs from the message text.
    const inlineImageUrls = extractUrls(messageText).filter((url) =>
        url.match(/\.(jpeg|jpg|gif|png)$/i)
    );

    const handleSubmitEditing = () => {
        sendMessageHandler();
    };

    return (
        <View>
            <View style={styles.inputBorderLine} />

            {/* Inline image previews */}
            {inlineImageUrls.length > 0 && (
                <View style={styles.inlineAttachmentContainer}>
                    {inlineImageUrls.map((url, index) => (
                        <View key={index} style={styles.attachmentPreview}>
                            <TouchableOpacity
                                onPress={() => onInlineImagePress(url)}
                            >
                                <NexusImage
                                    source={url}
                                    alt="Inline image preview"
                                    style={styles.attachmentImage}
                                    width={80}
                                    height={80}
                                    resizeMode="cover"
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.removeAttachmentButton}
                                onPress={() =>
                                    setMessageText(
                                        messageText.replace(url, '').trim()
                                    )
                                }
                            >
                                <Cancel
                                    size={15}
                                    color={theme.colors.ActiveText}
                                />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            <AttachmentPreviews
                attachments={attachments}
                onAttachmentPress={(att) => onAttachmentPreviewPress(att)}
                onRemoveAttachment={(id) =>
                    setAttachments((prev) => prev.filter((a) => a.id !== id))
                }
                onAttachmentsReorder={setAttachments}
            />

            <View style={styles.inputContainerNoBorder}>
                <TouchableOpacity
                    onPress={handleImageUpload}
                    style={styles.imageButton}
                >
                    <ImageIcon size={24} />
                </TouchableOpacity>
                <MarkdownTextInput
                    value={messageText}
                    onChangeText={setMessageText}
                    onSubmitEditing={handleSubmitEditing}
                    placeholder={`Message ${recipientName}`}
                    returnKeyType="send"
                />
                <TouchableOpacity
                    ref={gifButtonRef}
                    onPress={() => {
                        if (gifButtonRef.current) {
                            gifButtonRef.current.measureInWindow(
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                (x: any, y: any, width: any, height: any) => {
                                    setGifButtonLayout({ x, y, width, height });
                                    setShowGiphy(true);
                                }
                            );
                        } else {
                            setShowGiphy(true);
                        }
                    }}
                    style={styles.gifButton}
                >
                    <Text style={styles.gifButtonText}>GIF</Text>
                </TouchableOpacity>
                {(messageText.length > 0 || attachments.length > 0) &&
                    Platform.OS !== 'web' && (
                        <TouchableOpacity
                            onPress={() => sendMessageHandler()}
                            style={styles.sendButton}
                        >
                            <PaperPlane />
                        </TouchableOpacity>
                    )}
            </View>

            <GiphyModal
                variant="uri"
                visible={showGiphy}
                onClose={() => setShowGiphy(false)}
                anchorPosition={gifButtonLayout || undefined}
                onSelectGif={(attachment) => {
                    // @ts-expect-error attachment
                    sendMessageHandler(attachment.file.uri);
                }}
            />
        </View>
    );
};

function createStyles(theme: Theme) {
    return StyleSheet.create({
        inputBorderLine: {
            height: 1,
            backgroundColor: '#4A3A5A',
            width: '100%',
        },
        inlineAttachmentContainer: {
            paddingVertical: 10,
            paddingHorizontal: 10,
            flexDirection: 'row',
            alignItems: 'center',
        },
        attachmentPreview: {
            position: 'relative',
            marginRight: 10,
        },
        attachmentImage: {
            width: 80,
            height: 80,
            borderRadius: 10,
        },
        removeAttachmentButton: {
            position: 'absolute',
            top: 4,
            right: 4,
            backgroundColor: theme.colors.AppBackground,
            width: 24,
            height: 24,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
        },
        inputContainerNoBorder: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 10,
            backgroundColor: theme.colors.SecondaryBackground,
        },
        imageButton: {
            marginRight: 10,
            padding: 8,
        },
        gifButton: {
            marginHorizontal: 10,
            padding: 8,
        },
        gifButtonText: {
            color: theme.colors.ActiveText,
            fontSize: 16,
            fontWeight: 'bold',
        },
        sendButton: {
            marginLeft: 10,
            padding: 8,
        },
    });
}
