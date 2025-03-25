import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Dimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { COLORS, GIPHY_API_KEY } from '../constants';
import { Attachment } from '../types';
import { MiniModal } from './MiniModal';

// Minimal File polyfill for React Native if not available.
if (typeof File === 'undefined') {
    // Create a minimal polyfill for File by extending Blob.
    // Note: This is a basic polyfill and might not support all File functionalities.
    class RNFile extends Blob {
        name: string;
        lastModified: number;
        constructor(
            blobParts: BlobPart[],
            fileName: string,
            options?: FilePropertyBag
        ) {
            super(blobParts, options);
            this.name = fileName;
            this.lastModified = options?.lastModified || Date.now();
        }
    }
    // @ts-expect-error file
    global.File = RNFile;
}

export type GiphyModalProps = {
    visible: boolean;
    onClose: () => void;
    onSelectGif: (attachment: Attachment) => void;
    variant?: 'download' | 'uri';
    // New prop: anchorPosition to orient the modal relative to the trigger element
    anchorPosition?: { x: number; y: number; width: number; height: number };
};

export const GiphyModal: React.FC<GiphyModalProps> = ({
    visible,
    onClose,
    onSelectGif,
    variant = 'download',
    anchorPosition,
}) => {
    const [giphyQuery, setGiphyQuery] = useState('');
    const [giphyResults, setGiphyResults] = useState<any[]>([]);

    const windowWidth = Dimensions.get('window').width;

    // Fetch trending GIFs when the overlay is visible and no query is present.
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
        if (visible && !giphyQuery) {
            void fetchTrending();
        }
    }, [visible, giphyQuery]);

    // Search Giphy using the provided query.
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

    // Handle selection of a GIF result.
    const handleSelectGif = async (result: any) => {
        const gifUrl = result.images.original.url;
        if (variant === 'download') {
            try {
                const response = await fetch(gifUrl);
                const blob = await response.blob();
                const file = new File([blob], `${result.id}.gif`, {
                    type: 'image/gif',
                });
                const attachment: Attachment = {
                    id: result.id,
                    previewUri: gifUrl,
                    file,
                };
                onSelectGif(attachment);
                onClose();
            } catch (error) {
                console.error('Error fetching gif blob:', error);
            }
        } else {
            // 'uri' mode: create the attachment using the gif URL directly.
            const attachment: Attachment = {
                id: result.id,
                previewUri: gifUrl,
                file: { uri: gifUrl, type: 'gif', name: `${result.id}.gif` },
            };
            onSelectGif(attachment);
            onClose();
        }
    };

    if (!visible) return null;

    // Container style for Giphy modal. This style is used when no anchorPosition is provided.
    const giphyContainerStyle = {
        width: windowWidth < 768 ? 300 : 400,
        maxHeight: 400,
        backgroundColor: COLORS.PrimaryBackground,
        borderRadius: 8,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    };

    return (
        <MiniModal
            visible={visible}
            onClose={onClose}
            containerStyle={giphyContainerStyle}
            anchorPosition={anchorPosition}
        >
            <Text style={styles.modalTitle}>Giphy GIF Search</Text>
            <TextInput
                style={styles.giphySearchInput}
                value={giphyQuery}
                onChangeText={setGiphyQuery}
                placeholder="Search GIFs"
                placeholderTextColor={COLORS.InactiveText}
                onSubmitEditing={() => searchGiphy(giphyQuery)}
            />
            <ScrollView style={styles.giphyResultsContainer}>
                <View style={styles.giphyGridContainer}>
                    {giphyResults.map((result) => (
                        <TouchableOpacity
                            key={result.id}
                            onPress={() => handleSelectGif(result)}
                            style={styles.giphyResultItem}
                        >
                            <ExpoImage
                                contentFit="contain"
                                source={{ uri: result.images.original.url }}
                                style={styles.giphyResultImage}
                            />
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </MiniModal>
    );
};

const styles = StyleSheet.create({
    modalTitle: {
        fontSize: 18,
        color: COLORS.White,
        marginBottom: 15,
    },
    giphySearchInput: {
        height: 40,
        width: '100%',
        backgroundColor: COLORS.TextInput,
        borderRadius: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginBottom: 10,
        color: COLORS.MainText,
    },
    giphyResultsContainer: {
        flex: 1,
        marginBottom: 15,
    },
    giphyGridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    giphyResultItem: {
        width: '48%',
        marginBottom: 10,
    },
    giphyResultImage: {
        width: '100%',
        height: 150,
        borderRadius: 6,
    },
});
