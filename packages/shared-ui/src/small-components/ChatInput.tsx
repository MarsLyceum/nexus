import React, { useState, useRef } from 'react';
import {
    View,
    TouchableOpacity,
    Platform,
    StyleSheet,
    Text,
} from 'react-native';
import { SolitoImage } from 'solito/image';

import { COLORS } from '../constants';
import { AttachmentPreviews } from '../sections';
import { Attachment } from '../types';
import { MarkdownTextInput } from './MarkdownTextInput';
import { extractUrls } from '../utils';
import { Cancel, ImageIcon, PaperPlane } from '../icons';

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
    const [gifButtonLayout, setGifButtonLayout] = useState<{
        x: number;
        y: number;
        width: number;
        height: number;
    } | null>(null);

    // Create a ref for the GIF button.
    const gifButtonRef = useRef<TouchableOpacity>(null);

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
                                <SolitoImage
                                    src={url}
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
                                <Cancel size={15} color={COLORS.White} />
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
                                (x, y, width, height) => {
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
                    sendMessageHandler(attachment.file.uri);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
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
        backgroundColor: COLORS.AppBackground,
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
        backgroundColor: COLORS.SecondaryBackground,
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
        color: COLORS.White,
        fontSize: 16,
        fontWeight: 'bold',
    },
    sendButton: {
        marginLeft: 10,
        padding: 8,
    },
});
