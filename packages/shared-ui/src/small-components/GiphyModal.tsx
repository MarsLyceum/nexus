import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Dimensions,
    LayoutChangeEvent,
} from 'react-native';

import { NexusImage } from './NexusImage';
import { GIPHY_API_KEY } from '../constants';
import { useTheme, Theme } from '../theme';
import { Attachment } from '../types';
import { MiniModal } from './MiniModal';

if (typeof File === 'undefined') {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [giphyResults, setGiphyResults] = useState<any[]>([]);
    const [itemWidth, setItemWidth] = useState<number>(0); // Dynamic width for SolitoImage
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const windowWidth = Dimensions.get('window').width;

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
        if (visible && !giphyQuery) void fetchTrending();
    }, [visible, giphyQuery]);

    const searchGiphy = async (query: string) => {
        if (!query) return;
        try {
            const response = await fetch(
                `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20`
            );
            const data = await response.json();
            setGiphyResults(data.data);
        } catch (error) {
            console.error('Error searching Giphy:', error);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSelectGif = async (result: any) => {
        const gifUrl = result.images.original.url;
        if (variant === 'download') {
            try {
                const response = await fetch(gifUrl);
                const blob = await response.blob();
                const file = new File([blob], `${result.id}.gif`, {
                    type: 'image/gif',
                });
                onSelectGif({ id: result.id, previewUri: gifUrl, file });
                onClose();
            } catch (error) {
                console.error('Error fetching gif blob:', error);
            }
        } else {
            onSelectGif({
                id: result.id,
                previewUri: gifUrl,
                file: { uri: gifUrl, type: 'gif', name: `${result.id}.gif` },
            });
            onClose();
        }
    };

    const handleItemLayout = (e: LayoutChangeEvent) => {
        const { width } = e.nativeEvent.layout;
        setItemWidth(width);
    };

    if (!visible) return undefined;

    const giphyContainerStyle = {
        width: windowWidth < 768 ? 300 : 400,
        maxHeight: 400,
        backgroundColor: theme.colors.PrimaryBackground,
        borderRadius: 8,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        zIndex: 10_001,
        elevation: 10_001,
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
                placeholderTextColor={theme.colors.InactiveText}
                onSubmitEditing={() => searchGiphy(giphyQuery)}
            />
            <ScrollView style={styles.giphyResultsContainer}>
                <View style={styles.giphyGridContainer}>
                    {giphyResults.map((result) => (
                        <TouchableOpacity
                            key={result.id}
                            onLayout={handleItemLayout}
                            onPress={() => handleSelectGif(result)}
                            style={styles.giphyResultItem}
                        >
                            {itemWidth > 0 && (
                                <NexusImage
                                    source={result.images.original.url}
                                    width={itemWidth}
                                    height={150}
                                    alt={`GIF ${result.id}`}
                                    contentFit="cover"
                                    style={styles.giphyResultImage}
                                />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </MiniModal>
    );
};

function createStyles(theme: Theme) {
    return StyleSheet.create({
        modalTitle: {
            fontSize: 18,
            color: theme.colors.ActiveText,
            marginBottom: 15,
        },
        giphySearchInput: {
            height: 40,
            width: '100%',
            backgroundColor: theme.colors.TextInput,
            borderRadius: 5,
            paddingHorizontal: 10,
            paddingVertical: 5,
            marginBottom: 10,
            color: theme.colors.MainText,
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
            borderRadius: 6,
        },
    });
}
