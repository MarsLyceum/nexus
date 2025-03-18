import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { getDomainFromUrl } from '../utils/linkPreviewUtils';
import { COLORS } from '../constants';
import { PreviewData } from '../types';
import { LargeImageModal } from '../sections'; // Import the large image modal

export type FallbackPreviewProps = {
    url: string;
    previewData: PreviewData;
};

export const FallbackPreview: React.FC<FallbackPreviewProps> = ({
    url,
    previewData,
}) => {
    // State to control modal visibility.
    const [modalVisible, setModalVisible] = useState(false);

    // Determine attachments: use all images if available, or fallback to logo.
    const attachments =
        previewData.images && previewData.images.length > 0
            ? previewData.images
            : previewData.logo
              ? [previewData.logo]
              : [];

    // Use the first image as the preview image.
    const previewImage = attachments[0];
    const siteToShow = previewData.siteName || getDomainFromUrl(url);

    return (
        <View style={styles.linkPreviewContainer}>
            {previewImage ? (
                <TouchableOpacity onPress={() => setModalVisible(true)}>
                    <ExpoImage
                        source={{ uri: previewImage }}
                        style={styles.linkPreviewImage}
                        contentFit="contain"
                    />
                </TouchableOpacity>
            ) : undefined}
            {previewData.title ? (
                <Text style={styles.linkPreviewTitle}>{previewData.title}</Text>
            ) : undefined}
            {previewData.description ? (
                <Text style={styles.linkPreviewDescription}>
                    {previewData.description}
                </Text>
            ) : undefined}
            <Text style={styles.linkPreviewSite}>{siteToShow}</Text>
            <LargeImageModal
                visible={modalVisible}
                attachments={attachments}
                initialIndex={0}
                onClose={() => setModalVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    linkPreviewContainer: {
        borderWidth: 0,
        borderColor: '#ccc',
        padding: 10,
        marginVertical: 5,
        borderRadius: 8,
    },
    linkPreviewImage: {
        width: '100%',
        height: 150,
        marginBottom: 5,
    },
    linkPreviewTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 3,
        color: COLORS.White,
    },
    linkPreviewDescription: {
        fontSize: 14,
        color: COLORS.White,
    },
    linkPreviewSite: {
        fontSize: 12,
        color: COLORS.InactiveText,
        marginTop: 5,
    },
});
