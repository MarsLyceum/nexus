import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Platform,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import * as FileSystem from 'expo-file-system';
import { COLORS, GIPHY_API_KEY } from '../constants';
import { Attachment } from '../types';
import { MiniModal } from './MiniModal';

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
                const response = await fetch(gifUrl);
                const blob = await response.blob();
                const previewUri = URL.createObjectURL(blob);
                fileData = new File([blob], `${result.id}.gif`, {
                    type: 'image/gif',
                });
                localUri = previewUri;
            } else {
                const fileUri =
                    FileSystem.documentDirectory + result.id + '.gif';
                const { uri } = await FileSystem.downloadAsync(gifUrl, fileUri);
                fileData = { uri, type: 'gif', name: `${result.id}.gif` };
                localUri = uri;
            }

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

    if (!visible) return null;

    // Updated container style for Giphy modal to align above the input box.
    const giphyContainerStyle = {
        position: 'absolute',
        left: '50%',
        bottom: 70, // Aligns modal above the input box
        width: 350,
        maxHeight: 350, // Allows expansion for larger results
        backgroundColor: COLORS.PrimaryBackground,
        borderRadius: 8,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
        transform: [{ translateX: 80 }], // Center horizontally
    };

    return (
        <MiniModal
            visible={visible}
            onClose={onClose}
            containerStyle={giphyContainerStyle}
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
        width: '30%',
        marginBottom: 10,
    },
    giphyResultImage: {
        width: '100%',
        height: 100,
        borderRadius: 6,
    },
});
