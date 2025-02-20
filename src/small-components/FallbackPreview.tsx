// components/FallbackPreview.tsx

import React from 'react';
import { TouchableOpacity, Linking, Text, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { getDomainFromUrl } from '../utils/linkPreviewUtils';
import { COLORS } from '../constants';

export type FallbackPreviewProps = {
    url: string;
    previewData: any;
};

export const FallbackPreview: React.FC<FallbackPreviewProps> = ({
    url,
    previewData,
}) => {
    const previewImage =
        previewData.images && previewData.images[0]
            ? previewData.images[0]
            : previewData.logo;
    const siteToShow = previewData.siteName || getDomainFromUrl(url);
    return (
        <TouchableOpacity
            onPress={() => Linking.openURL(url)}
            style={styles.linkPreviewContainer}
        >
            {previewImage ? (
                <ExpoImage
                    source={{ uri: previewImage }}
                    style={styles.linkPreviewImage}
                    contentFit="cover"
                />
            ) : null}
            {previewData.title ? (
                <Text style={styles.linkPreviewTitle}>{previewData.title}</Text>
            ) : null}
            {previewData.description ? (
                <Text style={styles.linkPreviewDescription}>
                    {previewData.description}
                </Text>
            ) : null}
            <Text style={styles.linkPreviewSite}>{siteToShow}</Text>
        </TouchableOpacity>
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
