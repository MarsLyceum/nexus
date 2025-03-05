import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    TouchableOpacity,
    Platform,
    StyleSheet,
    Text,
    ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { Image as ExpoImage } from 'expo-image';
// @ts-expect-error no types
import emoji from 'emoji-dictionary';
import { COLORS } from '../constants';
import { AttachmentPreviews } from '../sections';
import { Attachment } from '../types';
import { MarkdownTextInput } from './MarkdownTextInput';
import { extractUrls } from '../utils';

// Utility to check if a URL is an image
const isImageUrl = (url: string): boolean => /\.(jpeg|jpg|gif|png)$/i.test(url);

// Use all supported emoji names from emoji-dictionary using emoji.names.
const emojiNames = emoji.names;

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
    // State for emoji search query, suggestions, and active suggestion index.
    const [emojiQuery, setEmojiQuery] = useState('');
    const [emojiSuggestions, setEmojiSuggestions] = useState<
        { name: string; emoji: string }[]
    >([]);
    const [activeEmojiIndex, setActiveEmojiIndex] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);

    // Effect to scroll the suggestions list so the active emoji is centered.
    useEffect(() => {
        if (scrollViewRef.current) {
            const containerHeight = 150; // same as maxHeight in style
            const itemHeight = 40; // assumed height per emoji suggestion
            let offset =
                activeEmojiIndex * itemHeight -
                containerHeight / 2 +
                itemHeight / 2;
            if (offset < 0) offset = 0;
            scrollViewRef.current.scrollTo({ y: offset, animated: true });
        }
    }, [activeEmojiIndex]);

    // Updates emoji suggestions based on the last colon query.
    const updateEmojiSuggestions = (text: string) => {
        const colonIndex = text.lastIndexOf(':');
        if (colonIndex !== -1) {
            const query = text.slice(Math.max(0, colonIndex + 1));
            if (query.length > 0 && /^\w+$/.test(query)) {
                setEmojiQuery(query);
                const suggestions = emojiNames
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

    // Wraps setMessageText to update emoji suggestions as the user types.
    const onMessageTextChange = (text: string) => {
        setMessageText(text);
        updateEmojiSuggestions(text);
    };

    // When an emoji suggestion is selected, replace the emoji query in the text.
    const handleEmojiSelect = (selected: { name: string; emoji: string }) => {
        const colonIndex = messageText.lastIndexOf(':');
        if (colonIndex !== -1) {
            // Replace the :query with the selected emoji and add a trailing space.
            const newText = `${
                messageText.slice(0, Math.max(0, colonIndex)) + selected.emoji
            } ${messageText.slice(
                Math.max(0, colonIndex + emojiQuery.length + 1)
            )}`;
            setMessageText(newText);
            setEmojiQuery('');
            setEmojiSuggestions([]);
        }
    };

    // Keyboard handler for navigating emoji suggestions.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleKeyPress = (e: any) => {
        if (emojiSuggestions.length > 0) {
            const { key } = e.nativeEvent;
            // eslint-disable-next-line default-case
            switch (key) {
                case 'ArrowDown': {
                    setActiveEmojiIndex(
                        (prev) => (prev + 1) % emojiSuggestions.length
                    );
                    e?.preventDefault();

                    break;
                }
                case 'ArrowUp': {
                    setActiveEmojiIndex(
                        (prev) =>
                            (prev - 1 + emojiSuggestions.length) %
                            emojiSuggestions.length
                    );
                    e?.preventDefault();

                    break;
                }
                case 'Enter': {
                    // If the emoji list is visible, select the active emoji instead of sending the message.
                    handleEmojiSelect(emojiSuggestions[activeEmojiIndex]);
                    e?.preventDefault();

                    break;
                }
                // No default
            }
        }
    };

    // onSubmitEditing only sends the message if no emoji suggestions are visible.
    const handleSubmitEditing = () => {
        if (emojiSuggestions.length === 0) {
            sendMessageHandler();
        }
    };

    // Get inline image URLs from the message text.
    const inlineImageUrls = extractUrls(messageText).filter((url) =>
        isImageUrl(url)
    );

    return (
        <View>
            <View style={styles.inputBorderLine} />

            {/* Render inline image previews */}
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
                                onPress={() => {
                                    setMessageText(
                                        messageText.replace(url, '').trim()
                                    );
                                }}
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

            {/* Emoji suggestion list wrapped in a ScrollView */}
            {emojiSuggestions.length > 0 && (
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.emojiSuggestionContainer}
                >
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
            )}

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
    emojiSuggestionContainer: {
        backgroundColor: COLORS.AppBackground,
        padding: 8,
        borderRadius: 8,
        marginHorizontal: 10,
        marginBottom: 5,
        maxHeight: 150, // Limits the container height and enables scrolling if needed
    },
    emojiSuggestionButton: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        marginRight: 5,
        marginBottom: 5,
        backgroundColor: COLORS.PrimaryBackground,
        borderRadius: 5,
        height: 40, // fixed height per suggestion
    },
    activeEmojiSuggestionButton: {
        backgroundColor: COLORS.SecondaryBackground, // Highlight the active emoji suggestion
    },
    emojiSuggestionText: {
        color: COLORS.White,
        fontSize: 14,
    },
});
