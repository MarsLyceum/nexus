// GiphyModal.tsx
import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Platform,
    StyleSheet,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import * as FileSystem from 'expo-file-system';
import { COLORS, GIPHY_API_KEY } from '../constants';
import { Attachment } from '../types';

type GiphyModalProps = {
    visible: boolean;
    onClose: () => void;
    onSelectGif: (attachment: Attachment) => void;
};

export const GiphyModal: React.FC<GiphyModalProps> = ({
    visible,
    onClose,
    onSelectGif,
}) => {
    const [giphyQuery, setGiphyQuery] = useState('');
    const [giphyResults, setGiphyResults] = useState<any[]>([]);

    // Fetch trending GIFs when the modal is visible and no query is present.
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
            fetchTrending();
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
        try {
            const gifUrl = result.images.original.url;
            let localUri = '';
            let fileData: File | { uri: string; type: string; name: string };
            if (Platform.OS === 'web') {
                // Fetch the gif as a blob and create a File (Blob subtype)
                const response = await fetch(gifUrl);
                const blob = await response.blob();
                const previewUri = URL.createObjectURL(blob);
                fileData = new File([blob], `${result.id}.gif`, {
                    type: 'image/gif',
                });
                localUri = previewUri;
            } else {
                // Download the file using Expo FileSystem on native platforms.
                const fileUri =
                    FileSystem.documentDirectory + result.id + '.gif';
                const { uri } = await FileSystem.downloadAsync(gifUrl, fileUri);
                fileData = { uri, type: 'gif', name: `${result.id}.gif` };
                localUri = uri;
            }
            // Create the attachment object that matches your type.
            const attachment: Attachment = {
                id: result.id,
                previewUri: localUri,
                file: fileData,
            };
            onSelectGif(attachment);
            onClose();
        } catch (error) {
            console.error('Error downloading gif:', error);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
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
                                onPress={() => handleSelectGif(result)}
                                style={styles.giphyResultItem}
                            >
                                <ExpoImage
                                    source={{ uri: result.images.original.url }}
                                    style={styles.giphyResultImage}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
                <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeModalButton}
                >
                    <Text style={styles.closeModalText}>Close</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
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
