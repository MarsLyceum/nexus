import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    LayoutChangeEvent,
    Image as RNImage,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { CarouselDots } from './CarouselDots';

export type AttachmentImageGalleryProps = {
    attachmentUrls: string[];
    onImagePress: (index: number) => void;
};

export const AttachmentImageGallery: React.FC<AttachmentImageGalleryProps> = ({
    attachmentUrls,
    onImagePress,
}) => {
    const [currentAttachmentIndex] = useState(0);
    const [containerWidth, setContainerWidth] = useState(480); // default width fallback
    const [imageAspectRatio, setImageAspectRatio] = useState(1); // default ratio (square) until loaded

    // Capture the container layout dimensions
    const handleContainerLayout = (event: LayoutChangeEvent) => {
        const { width } = event.nativeEvent.layout;
        setContainerWidth(width);
    };

    // Calculate the image width based on container width
    const imageWidth = containerWidth < 480 ? containerWidth : 480;
    // Compute the image height based on its aspect ratio
    const computedImageHeight = imageWidth / imageAspectRatio;

    // Retrieve the natural dimensions of the image to compute its aspect ratio
    useEffect(() => {
        if (attachmentUrls[currentAttachmentIndex]) {
            RNImage.getSize(
                attachmentUrls[currentAttachmentIndex],
                (width, height) => {
                    setImageAspectRatio(width / height);
                },
                (error) => {
                    console.error('Failed to get image dimensions', error);
                }
            );
        }
    }, [attachmentUrls, currentAttachmentIndex]);

    return (
        <View onLayout={handleContainerLayout}>
            <View
                style={[
                    styles.imageContainer,
                    { width: imageWidth, height: computedImageHeight },
                ]}
            >
                <TouchableOpacity
                    onPress={() => onImagePress(currentAttachmentIndex)}
                    activeOpacity={0.8}
                >
                    <ExpoImage
                        source={{ uri: attachmentUrls[currentAttachmentIndex] }}
                        style={[
                            styles.galleryImage,
                            { width: imageWidth, height: computedImageHeight },
                        ]}
                    />
                </TouchableOpacity>
                {attachmentUrls.length > 1 && (
                    <View style={styles.overlayDots}>
                        <CarouselDots
                            totalItems={attachmentUrls.length}
                            currentIndex={currentAttachmentIndex}
                        />
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    imageContainer: {
        position: 'relative',
        alignSelf: 'flex-start', // left aligned container
    },
    galleryImage: {
        borderRadius: 8,
        resizeMode: 'contain',
    },
    overlayDots: {
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
});
