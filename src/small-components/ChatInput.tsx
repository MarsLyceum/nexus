import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    TouchableOpacity,
    Platform,
    StyleSheet,
    Text,
    ScrollView,
    TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import emoji from 'emoji-dictionary';
import { Image as ExpoImage } from 'expo-image';
import { COLORS } from '../constants';
import { AttachmentPreviews } from '../sections';
import { Attachment } from '../types';
import { MarkdownTextInput } from './MarkdownTextInput';
import { extractUrls } from '../utils';
import { GiphyModal } from './GiphyModal';
import { MiniModal } from './MiniModal';

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
    const [emojiQuery, setEmojiQuery] = useState('');
    const [emojiSuggestions, setEmojiSuggestions] = useState<
        { name: string; emoji: string }[]
    >([]);
    const [activeEmojiIndex, setActiveEmojiIndex] = useState(0);
    const [showGiphy, setShowGiphy] = useState(false);

    // Update emoji suggestions based on the last colon query.
    const updateEmojiSuggestions = (text: string) => {
        const colonIndex = text.lastIndexOf(':');
        if (colonIndex !== -1) {
            const query = text.slice(Math.max(0, colonIndex + 1));
            if (query.length > 0 && /^\w+$/.test(query)) {
                setEmojiQuery(query);
                const suggestions = emoji.names
                    .filter((name: string) =>
                        name.startsWith(query.toLowerCase())
                    )
                    .map((name: string) => ({
                        name,
                        emoji: emoji.getUnicode(name),
                    }));
                setEmojiSuggestions(suggestions);
                if (suggestions.length > 0) {
                    setActiveEmojiIndex(0);
                }
            } else {
                setEmojiQuery('');
                setEmojiSuggestions([]);
            }
        } else {
            setEmojiQuery('');
            setEmojiSuggestions([]);
        }
    };

    // Wrap setMessageText to update emoji suggestions.
    const onMessageTextChange = (text: string) => {
        setMessageText(text);
        updateEmojiSuggestions(text);
    };

    // Replace the current colon query with the selected emoji.
    const handleEmojiSelect = (selected: { name: string; emoji: string }) => {
        const colonIndex = messageText.lastIndexOf(':');
        if (colonIndex !== -1) {
            const newText =
                messageText.slice(0, colonIndex) +
                selected.emoji +
                ' ' +
                messageText.slice(colonIndex + emojiQuery.length + 1);
            setMessageText(newText);
            setEmojiQuery('');
            setEmojiSuggestions([]);
        }
    };

    // Keyboard handler to navigate emoji suggestions.
    const handleKeyPress = (e: any) => {
        if (emojiSuggestions.length > 0) {
            const { key } = e.nativeEvent;
            if (key === 'ArrowDown') {
                setActiveEmojiIndex(
                    (prev) => (prev + 1) % emojiSuggestions.length
                );
                e.preventDefault();
            } else if (key === 'ArrowUp') {
                setActiveEmojiIndex(
                    (prev) =>
                        (prev - 1 + emojiSuggestions.length) %
                        emojiSuggestions.length
                );
                e.preventDefault();
            } else if (key === 'Enter') {
                handleEmojiSelect(emojiSuggestions[activeEmojiIndex]);
                e.preventDefault();
            }
        }
    };

    // Send message only if no emoji suggestions are visible.
    const handleSubmitEditing = () => {
        if (emojiSuggestions.length === 0) {
            sendMessageHandler();
        }
    };

    // Extract inline image URLs from the message text.
    const inlineImageUrls = extractUrls(messageText).filter((url) =>
        url.match(/\.(jpeg|jpg|gif|png)$/i)
    );

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
                                <ExpoImage
                                    source={{ uri: url }}
                                    style={styles.attachmentImage}
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
                                <Icon
                                    name="times"
                                    size={18}
                                    color={COLORS.White}
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
                    <Icon name="image" size={24} color="white" />
                </TouchableOpacity>
                <MarkdownTextInput
                    value={messageText}
                    onChangeText={onMessageTextChange}
                    onKeyPress={handleKeyPress}
                    onSubmitEditing={handleSubmitEditing}
                    placeholder={`Message ${recipientName}`}
                    returnKeyType="send"
                />
                <TouchableOpacity
                    onPress={() => setShowGiphy(true)}
                    style={styles.gifButton}
                >
                    <Text style={styles.gifButtonText}>GIF</Text>
                </TouchableOpacity>
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

            {/* Emoji suggestions modal using MiniModal */}
            <MiniModal
                visible={emojiSuggestions.length > 0}
                onClose={() => setEmojiSuggestions([])}
            >
                <ScrollView>
                    {emojiSuggestions.map((suggestion, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => handleEmojiSelect(suggestion)}
                            style={[
                                styles.emojiSuggestionButton,
                                index === activeEmojiIndex &&
                                    styles.activeEmojiSuggestionButton,
                            ]}
                        >
                            <Text style={styles.emojiSuggestionText}>
                                {suggestion.emoji} {suggestion.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </MiniModal>

            {/* Render the Giphy modal */}
            <GiphyModal
                visible={showGiphy}
                onClose={() => setShowGiphy(false)}
                onSelectGif={(attachment) =>
                    setAttachments((prev) => [...prev, attachment])
                }
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
    emojiSuggestionButton: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        marginBottom: 5,
        backgroundColor: COLORS.PrimaryBackground,
        borderRadius: 5,
    },
    activeEmojiSuggestionButton: {
        backgroundColor: COLORS.SecondaryBackground,
    },
    emojiSuggestionText: {
        color: COLORS.White,
        fontSize: 14,
    },
});
