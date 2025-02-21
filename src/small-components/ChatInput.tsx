import React from 'react';
import { View, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { Image as ExpoImage } from 'expo-image';
import { COLORS } from '../constants';
import { AttachmentPreviews } from '../sections';
import { Attachment } from '../types';
import { MarkdownTextInput } from './MarkdownTextInput';

// Utility to check if a URL is an image
const isImageUrl = (url: string): boolean => /\.(jpeg|jpg|gif|png)$/i.test(url);

export type ChatInputProps = {
    messageText: string;
    setMessageText: (text: string) => void;
    attachments: Attachment[];
    setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
    handleImageUpload: () => void;
    sendMessageHandler: () => void;
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
    const trimmed = messageText.trim();
    const inlineImageUrl =
        trimmed.startsWith('http') &&
        !trimmed.includes(' ') &&
        isImageUrl(trimmed)
            ? trimmed
            : undefined;

    return (
        <View>
            <View style={styles.inputBorderLine} />
            {inlineImageUrl && (
                <View style={styles.inlineAttachmentContainer}>
                    <View style={styles.attachmentPreview}>
                        <TouchableOpacity
                            onPress={() => onInlineImagePress(inlineImageUrl)}
                        >
                            <ExpoImage
                                source={{ uri: inlineImageUrl }}
                                style={styles.attachmentImage}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.removeAttachmentButton}
                            onPress={() => setMessageText('')}
                        >
                            <Icon name="times" size={18} color={COLORS.White} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <AttachmentPreviews
                attachments={attachments}
                onAttachmentPress={(att) => onAttachmentPreviewPress(att)}
                onRemoveAttachment={(id) =>
                    setAttachments((prev) => prev.filter((a) => a.id !== id))
                }
            />

            <View style={styles.inputContainerNoBorder}>
                <TouchableOpacity
                    onPress={handleImageUpload}
                    style={styles.imageButton}
                >
                    <Icon name="image" size={24} color="white" />
                </TouchableOpacity>
                <MarkdownTextInput
                    value={messageText}
                    onChangeText={setMessageText}
                    placeholder={`Message ${recipientName}`}
                    onSubmitEditing={sendMessageHandler}
                    returnKeyType="send"
                />
                {(messageText.length > 0 || attachments.length > 0) &&
                    Platform.OS !== 'web' && (
                        <TouchableOpacity
                            onPress={sendMessageHandler}
                            style={styles.sendButton}
                        >
                            <Icon name="paper-plane" size={18} color="white" />
                        </TouchableOpacity>
                    )}
            </View>
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
    sendButton: {
        marginLeft: 10,
        padding: 8,
    },
});
