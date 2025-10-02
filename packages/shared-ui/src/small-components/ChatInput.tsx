import React, { useState, useRef, useMemo } from 'react';
import {
    View,
    TouchableOpacity,
    Platform,
    StyleSheet,
    Text,
} from 'react-native';

import { useTheme, Theme } from '../theme';
import { AttachmentPreviews } from '../sections/AttachmentPreviews';
import { Attachment } from '../types';
import { extractUrls, toRgba } from '../utils';
import { Cancel, ImageIcon, PaperPlane } from '../icons';
import {
    BorderRadius,
    Spacing,
    Opacity,
    Typography,
} from '../constants/designSystem';

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
    const imageUrlRegex = /\.(jpeg|jpg|gif|png)$/i;
    const inlineImageUrls = extractUrls(messageText).filter((url) =>
        imageUrlRegex.exec(url)
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
            backgroundColor: toRgba(
                theme.colors.ActiveText,
                Opacity.BorderMedium
            ),
            width: '100%',
        },
        inlineAttachmentContainer: {
            paddingVertical: Spacing.SM,
            paddingHorizontal: Spacing.SM,
            flexDirection: 'row',
            alignItems: 'center',
        },
        attachmentPreview: {
            position: 'relative',
            marginRight: Spacing.SM,
        },
        attachmentImage: {
            width: 80,
            height: 80,
            borderRadius: BorderRadius.SM,
        },
        removeAttachmentButton: {
            position: 'absolute',
            top: Spacing.XS,
            right: Spacing.XS,
            backgroundColor: theme.colors.AppBackground,
            width: Spacing.XXL,
            height: Spacing.XXL,
            borderRadius: BorderRadius.Pill,
            justifyContent: 'center',
            alignItems: 'center',
        },
        inputContainerNoBorder: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: Spacing.SM,
            backgroundColor: theme.colors.SecondaryBackground,
        },
        imageButton: {
            marginRight: Spacing.SM,
            padding: Spacing.SM,
        },
        gifButton: {
            marginHorizontal: Spacing.SM,
            padding: Spacing.SM,
        },
        gifButtonText: {
            ...Typography.Body,
            fontFamily: theme.fonts.primary?.semibold,
            color: theme.colors.ActiveText,
        },
        sendButton: {
            marginLeft: Spacing.SM,
            padding: Spacing.SM,
        },
    });
}
