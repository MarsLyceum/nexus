import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    TouchableOpacity,
    Text,
    StyleSheet,
    Linking,
    Image as RNImage, // for getSize
} from 'react-native';

import { getDomainFromUrl } from '../utils';
import { useTheme, Theme } from '../theme';
import { PreviewData } from '../types';
import { ImageDetailsModal } from '../sections'; // Large image modal

import { NexusImage } from './NexusImage';

export type RegularWebsitePreviewProps = {
    url: string;
    previewData: PreviewData;
};

export const RegularWebsitePreview: React.FC<RegularWebsitePreviewProps> = ({
    url,
    previewData,
}) => {
    console.log('previewData:', previewData);
    // State to control modal visibility.
    const [modalVisible, setModalVisible] = useState(false);
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    // State to store the actual image dimensions.
    const [imageDimensions, setImageDimensions] = useState<
        | {
              width: number;
              height: number;
          }
        | undefined
    >();

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

    // Use previewData.description directly.
    const descriptionToShow = previewData.description;

    // Use RNImage.getSize to determine image dimensions.
    useEffect(() => {
        if (previewImage) {
            RNImage.getSize(
                previewImage,
                (width, height) => setImageDimensions({ width, height }),
                (error) => console.error('Failed to get image size:', error)
            );
        }
    }, [previewImage]);

    // Calculate dynamic dimensions (50% of native size), with fallbacks.
    const computedWidth = imageDimensions
        ? imageDimensions.width > 450
            ? imageDimensions.width * 0.35
            : imageDimensions.width * 0.5
        : 200;
    const computedHeight = imageDimensions
        ? imageDimensions.height > 450
            ? imageDimensions.height * 0.35
            : imageDimensions.height * 0.5
        : 150;

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
                    <NexusImage
                        source={previewImage}
                        style={{
                            ...styles.linkPreviewImage,
                            width: computedWidth,
                            height: computedHeight,
                        }}
                        contentFit="contain"
                        width={computedWidth}
                        height={computedHeight}
                        alt="Website preview image"
                        unoptimized
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

function createStyles(theme: Theme) {
    return StyleSheet.create({
        linkPreviewContainer: {
            borderLeftWidth: 5,
            borderLeftColor: theme.colors.AppBackground,
            backgroundColor: theme.colors.TertiaryBackground,
            padding: 10,
            marginVertical: 5,
        },
        // Default style for the image; dynamic dimensions will override these.
        linkPreviewImage: {
            height: 150, // fallback height
            marginTop: 5,
            marginBottom: 5,
            borderRadius: 8,
        },
        imageTouchable: {
            alignSelf: 'flex-start', // prevents stretching to full container width
        },
        linkPreviewTitle: {
            fontSize: 16,
            fontWeight: 'bold',
            marginBottom: 3,
            color: theme.colors.ActiveText,
            fontFamily: 'Roboto_700Bold',
        },
        linkPreviewDescription: {
            fontSize: 14,
            color: theme.colors.ActiveText,
            fontFamily: 'Roboto_400Regular',
            paddingTop: 5,
            paddingBottom: 5,
        },
        linkPreviewSite: {
            fontSize: 12,
            color: theme.colors.InactiveText,
            fontFamily: 'Roboto_400Regular',
            marginTop: 5,
        },
        linkPreviewSiteTouchable: {
            alignSelf: 'flex-start',
        },
    });
}
