import React, { useState, useEffect } from 'react';
import {
    View,
    TouchableOpacity,
    Text,
    StyleSheet,
    Linking,
    Image as RNImage, // Importing React Native Image as RNImage for getSize
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { getDomainFromUrl } from '../utils/linkPreviewUtils';
import { COLORS } from '../constants';
import { PreviewData } from '../types';
import { ImageDetailsModal } from '../sections'; // Import the large image modal

export type RegularWebsitePreviewProps = {
    url: string;
    previewData: PreviewData;
};

export const RegularWebsitePreview: React.FC<RegularWebsitePreviewProps> = ({
    url,
    previewData,
}) => {
    // State to control modal visibility.
    const [modalVisible, setModalVisible] = useState(false);

    // State to store the actual image dimensions.
    const [imageDimensions, setImageDimensions] = useState<{
        width: number;
        height: number;
    } | null>(null);

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

    // Now that the hook handles meta description extraction,
    // we directly use previewData.description.
    const descriptionToShow = previewData.description;

    // Use the React Native Image.getSize to determine the image dimensions.
    useEffect(() => {
        if (previewImage) {
            RNImage.getSize(
                previewImage,
                (width, height) => {
                    setImageDimensions({ width, height });
                },
                (error) => {
                    console.error('Failed to get image size: ', error);
                }
            );
        }
    }, [previewImage]);

    return (
        <View style={styles.linkPreviewContainer}>
            {previewData.title ? (
                <Text style={styles.linkPreviewTitle}>{previewData.title}</Text>
            ) : undefined}
            {descriptionToShow ? (
                <Text style={styles.linkPreviewDescription}>
                    {descriptionToShow}
                </Text>
            ) : undefined}
            {previewImage ? (
                <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    style={styles.imageTouchable} // restricts touchable area to image size
                >
                    <ExpoImage
                        source={{ uri: previewImage }}
                        // Apply dynamic dimensions if available, otherwise fallback to default style.
                        style={[
                            styles.linkPreviewImage,
                            imageDimensions
                                ? {
                                      width: imageDimensions.width * 0.5,
                                      height: imageDimensions.height * 0.5,
                                  }
                                : {},
                        ]}
                        contentFit="contain"
                    />
                </TouchableOpacity>
            ) : undefined}
            <TouchableOpacity
                onPress={() => Linking.openURL(url)}
                style={styles.linkPreviewSiteTouchable}
            >
                <Text style={styles.linkPreviewSite}>{siteToShow}</Text>
            </TouchableOpacity>
            <ImageDetailsModal
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
        borderLeftWidth: 5,
        borderLeftColor: COLORS.AppBackground,
        backgroundColor: COLORS.TertiaryBackground,
        padding: 10,
        marginVertical: 5,
    },
    // Default style for the image. Dynamic dimensions (if available) will override these.
    linkPreviewImage: {
        // Removed width: '100%' to allow dynamic sizing.
        height: 150, // fallback height in case dimensions aren't retrieved
        marginTop: 5,
        marginBottom: 5,
        borderRadius: 8,
    },
    imageTouchable: {
        alignSelf: 'flex-start', // Prevents the TouchableOpacity from stretching to full container width
    },
    linkPreviewTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 3,
        color: COLORS.White,
        fontFamily: 'Roboto_700Bold',
    },
    linkPreviewDescription: {
        fontSize: 14,
        color: COLORS.White,
        fontFamily: 'Roboto_400Regular',
        paddingTop: 5,
        paddingBottom: 5,
    },
    linkPreviewSite: {
        fontSize: 12,
        color: COLORS.InactiveText,
        fontFamily: 'Roboto_400Regular',
        marginTop: 5,
    },
    // This style ensures only the site text is clickable.
    linkPreviewSiteTouchable: {
        alignSelf: 'flex-start',
    },
});
