import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    TouchableOpacity,
    Text,
    StyleSheet,
    Linking,
    Image as RNImage, // for getSize
} from 'react-native';

import { getDomainFromUrl, computeMediaSize } from '../utils';
import { useTheme, Theme } from '../theme';
import { PreviewData } from '../types';
import { MediaDetailsModal } from '../sections/MediaDetailsModal';

import { NexusImage } from './NexusImage';

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

    const [imageContainerWidth, setImageContainerWidth] = useState<number>(300);

    const computedSize = computeMediaSize(
        imageDimensions ? imageDimensions.height / imageDimensions.width : 1,
        imageContainerWidth
    );

    return (
        <View
            style={styles.linkPreviewContainer}
            onLayout={(e) => {
                const layoutWidth = e.nativeEvent.layout.width;
                if (layoutWidth && layoutWidth !== imageContainerWidth) {
                    setImageContainerWidth(layoutWidth);
                }
            }}
        >
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
                        }}
                        contentPosition="left center"
                        contentFit="cover"
                        width={computedSize.width}
                        height={computedSize.height}
                        alt="Website preview image"
                    />
                </TouchableOpacity>
            ) : undefined}
            <TouchableOpacity
                onPress={() => Linking.openURL(url)}
                style={styles.linkPreviewSiteTouchable}
            >
                <Text style={styles.linkPreviewSite}>{siteToShow}</Text>
            </TouchableOpacity>
            <MediaDetailsModal
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
            marginTop: 5,
            marginBottom: 5,
            borderRadius: 8,
            overflow: 'hidden',
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
