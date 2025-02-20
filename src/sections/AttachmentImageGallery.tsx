import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    LayoutChangeEvent,
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

    // Capture the container layout dimensions
    const handleContainerLayout = (event: LayoutChangeEvent) => {
        const { width } = event.nativeEvent.layout;
        setContainerWidth(width);
    };

    // Calculate the image width based on container width
    const imageWidth = containerWidth < 480 ? containerWidth : 480;

    return (
        <View onLayout={handleContainerLayout}>
            <View
                style={[
                    styles.imageContainer,
                    { width: imageWidth, height: 480 },
                ]}
            >
                <TouchableOpacity
                    onPress={() => onImagePress(currentAttachmentIndex)}
                    activeOpacity={0.8}
                >
                    <ExpoImage
                        source={{ uri: attachmentUrls[currentAttachmentIndex] }}
                        style={[styles.galleryImage, { width: imageWidth }]}
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
        alignSelf: 'center',
    },
    galleryImage: {
        height: 480,
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
