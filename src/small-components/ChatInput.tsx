import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    TouchableOpacity,
    Platform,
    StyleSheet,
    Text,
    ScrollView,
    Modal,
    TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { Image as ExpoImage } from 'expo-image';
import * as FileSystem from 'expo-file-system';
// @ts-expect-error no types
import emoji from 'emoji-dictionary';
import { COLORS, GIPHY_API_KEY } from '../constants';
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

    // Local state for showing the Giphy GIF search modal and handling Giphy search.
    const [showGiphy, setShowGiphy] = useState(false);
    const [giphyQuery, setGiphyQuery] = useState('');
    const [giphyResults, setGiphyResults] = useState<any[]>([]);

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

    // Fetch trending GIFs when modal opens and no search query is present.
    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const response = await fetch(
                    `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20`
                );
                const data = await response.json();
                setGiphyResults(data.data);
            } catch (error) {
                console.error('Error fetching trending GIFs:', error);
            }
        };
        if (showGiphy && !giphyQuery) {
            fetchTrending();
        }
    }, [showGiphy, giphyQuery]);

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
                    handleEmojiSelect(emojiSuggestions[activeEmojiIndex]);
                    e?.preventDefault();
                    break;
                }
            }
        }
    };

    // onSubmitEditing only sends the message if no emoji suggestions are visible.
    const handleSubmitEditing = () => {
        if (emojiSuggestions.length === 0) {
            sendMessageHandler();
        }
    };

    // Handler for opening the Giphy GIF search modal.
    const handleGifPress = () => {
        setShowGiphy(true);
    };

    // Function to search Giphy using their API.
    const searchGiphy = async (query: string) => {
        if (!query) return;
        try {
            const response = await fetch(
                `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(
                    query
                )}&limit=20`
            );
            const data = await response.json();
            setGiphyResults(data.data);
        } catch (error) {
            console.error('Error searching Giphy:', error);
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

                {/* Updated GIF Button using text */}
                <TouchableOpacity
                    onPress={handleGifPress}
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

            {/* Modal for Giphy GIF Search */}
            <Modal
                visible={showGiphy}
                animationType="slide"
                onRequestClose={() => setShowGiphy(false)}
            >
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Giphy GIF Search</Text>
                    <TextInput
                        style={styles.giphySearchInput}
                        value={giphyQuery}
                        onChangeText={setGiphyQuery}
                        placeholder="Search GIFs"
                        placeholderTextColor="#ccc"
                    />
                    <TouchableOpacity
                        onPress={() => searchGiphy(giphyQuery)}
                        style={styles.giphySearchButton}
                    >
                        <Text style={styles.giphySearchButtonText}>Search</Text>
                    </TouchableOpacity>
                    <ScrollView style={styles.giphyResultsContainer}>
                        <View style={styles.giphyGridContainer}>
                            {giphyResults.map((result) => (
                                <TouchableOpacity
                                    key={result.id}
                                    onPress={async () => {
                                        try {
                                            const gifUrl =
                                                result.images.original.url;
                                            let localUri = '';
                                            let fileData:
                                                | File
                                                | {
                                                      uri: string;
                                                      type: string;
                                                      name: string;
                                                  };
                                            if (Platform.OS === 'web') {
                                                // On web, fetch the gif and convert to a File (which is a Blob subtype)
                                                const response =
                                                    await fetch(gifUrl);
                                                const blob =
                                                    await response.blob();
                                                const previewUri =
                                                    URL.createObjectURL(blob);
                                                // Create a File from the blob
                                                fileData = new File(
                                                    [blob],
                                                    `${result.id}.gif`,
                                                    {
                                                        type: 'image/gif',
                                                    }
                                                );
                                                localUri = previewUri;
                                            } else {
                                                // On native, download the file using expo-file-system
                                                const fileUri =
                                                    FileSystem.documentDirectory +
                                                    result.id +
                                                    '.gif';
                                                const { uri } =
                                                    await FileSystem.downloadAsync(
                                                        gifUrl,
                                                        fileUri
                                                    );
                                                fileData = {
                                                    uri,
                                                    type: 'gif',
                                                    name: `${result.id}.gif`,
                                                };
                                                localUri = uri;
                                            }
                                            // Create a new attachment matching your required type
                                            const newAttachment: Attachment = {
                                                id: result.id,
                                                previewUri: localUri,
                                                file: fileData,
                                            };
                                            setAttachments((prev) => [
                                                ...prev,
                                                newAttachment,
                                            ]);
                                            setShowGiphy(false);
                                        } catch (error) {
                                            console.error(
                                                'Error downloading gif:',
                                                error
                                            );
                                        }
                                    }}
                                    style={styles.giphyResultItem}
                                >
                                    <ExpoImage
                                        source={{
                                            uri: result.images.original.url,
                                        }}
                                        style={styles.giphyResultImage}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                    <TouchableOpacity
                        onPress={() => setShowGiphy(false)}
                        style={styles.closeModalButton}
                    >
                        <Text style={styles.closeModalText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
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
    emojiSuggestionContainer: {
        backgroundColor: COLORS.AppBackground,
        padding: 8,
        borderRadius: 8,
        marginHorizontal: 10,
        marginBottom: 5,
        maxHeight: 150,
    },
    emojiSuggestionButton: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        marginRight: 5,
        marginBottom: 5,
        backgroundColor: COLORS.PrimaryBackground,
        borderRadius: 5,
        height: 40,
    },
    activeEmojiSuggestionButton: {
        backgroundColor: COLORS.SecondaryBackground,
    },
    emojiSuggestionText: {
        color: COLORS.White,
        fontSize: 14,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.AppBackground,
        padding: 20,
    },
    modalTitle: {
        fontSize: 24,
        color: COLORS.White,
        marginBottom: 20,
    },
    giphySearchInput: {
        height: 40,
        width: '100%',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 10,
        color: COLORS.White,
    },
    giphySearchButton: {
        backgroundColor: COLORS.PrimaryBackground,
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 10,
        width: '100%',
    },
    giphySearchButtonText: {
        color: COLORS.White,
        fontSize: 16,
    },
    giphyResultsContainer: {
        width: '100%',
        marginBottom: 20,
    },
    giphyGridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    giphyResultItem: {
        width: '30%',
        marginBottom: 10,
    },
    giphyResultImage: {
        width: '100%',
        height: 100,
        borderRadius: 10,
    },
    closeModalButton: {
        padding: 10,
        backgroundColor: COLORS.PrimaryBackground,
        borderRadius: 5,
    },
    closeModalText: {
        color: COLORS.White,
        fontSize: 16,
    },
});
