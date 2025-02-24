// AttachmentImageGallery.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    LayoutChangeEvent,
    Image as RNImage,
    ScrollView,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { CarouselDots } from './CarouselDots';
import { ArrowButton } from './ArrowButton';
import { ImageCountOverlay } from '../small-components';

export type AttachmentImageGalleryProps = {
    attachmentUrls: string[];
    onImagePress: (index: number) => void;
};

export const AttachmentImageGallery: React.FC<AttachmentImageGalleryProps> = ({
    attachmentUrls,
    onImagePress,
}) => {
    // State for the current image index.
    const [currentAttachmentIndex, setCurrentAttachmentIndex] = useState(0);
    const [containerWidth, setContainerWidth] = useState(480); // default width fallback
    const [imageAspectRatio, setImageAspectRatio] = useState(1); // default ratio (square) until loaded

    // Ref for ScrollView to programmatically scroll when using arrow buttons.
    const scrollViewRef = useRef<ScrollView>(null);

    // Determine if the device is considered desktop (container width greater than 768px).
    const isDesktop = containerWidth > 768;

    // Capture the container layout dimensions.
    const handleContainerLayout = (event: LayoutChangeEvent) => {
        const { width } = event.nativeEvent.layout;
        setContainerWidth(width);
    };

    // Calculate the image width based on container width (with a max fallback of 480).
    const imageWidth = containerWidth < 480 ? containerWidth : 480;
    // Compute the image height based on its aspect ratio.
    const computedImageHeight = imageWidth / imageAspectRatio;

    // Retrieve the natural dimensions of the current image to compute its aspect ratio.
    useEffect(() => {
        const currentUrl = attachmentUrls[currentAttachmentIndex];
        if (currentUrl) {
            RNImage.getSize(
                currentUrl,
                (width, height) => {
                    setImageAspectRatio(width / height);
                },
                (error) => {
                    console.error('Failed to get image dimensions', error);
                }
            );
        }
    }, [attachmentUrls, currentAttachmentIndex]);

    // Handler for swipe events; calculate the new image index based on scroll offset.
    const handleMomentumScrollEnd = (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const newIndex = Math.round(offsetX / imageWidth);
        setCurrentAttachmentIndex(newIndex);
    };

    // Helper to update the index and scroll to the appropriate position.
    const goToIndex = (newIndex: number) => {
        setCurrentAttachmentIndex(newIndex);
        scrollViewRef.current?.scrollTo({
            x: newIndex * imageWidth,
            animated: true,
        });
    };

    return (
        <View onLayout={handleContainerLayout}>
            <View
                style={[
                    styles.imageContainer,
                    { width: imageWidth, height: computedImageHeight },
                ]}
            >
                <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={handleMomentumScrollEnd}
                    contentContainerStyle={{
                        width: imageWidth * attachmentUrls.length,
                    }}
                    ref={scrollViewRef}
                >
                    {attachmentUrls.map((url, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => onImagePress(index)}
                            activeOpacity={0.8}
                        >
                            <ExpoImage
                                source={{ uri: url }}
                                style={[
                                    styles.galleryImage,
                                    {
                                        width: imageWidth,
                                        height: computedImageHeight,
                                    },
                                ]}
                            />
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* New Image Count Overlay */}
                <ImageCountOverlay
                    currentIndex={currentAttachmentIndex}
                    total={attachmentUrls.length}
                />

                {isDesktop && (
                    <>
                        <ArrowButton
                            direction="left"
                            onPress={() =>
                                goToIndex(
                                    Math.max(currentAttachmentIndex - 1, 0)
                                )
                            }
                            disabled={currentAttachmentIndex === 0}
                            iconSize={30}
                            activeColor="white"
                            inactiveColor="gray"
                            style={{
                                position: 'absolute',
                                left: 10,
                                top: computedImageHeight / 2 - 15,
                            }}
                        />
                        <ArrowButton
                            direction="right"
                            onPress={() =>
                                goToIndex(
                                    Math.min(
                                        currentAttachmentIndex + 1,
                                        attachmentUrls.length - 1
                                    )
                                )
                            }
                            disabled={
                                currentAttachmentIndex ===
                                attachmentUrls.length - 1
                            }
                            iconSize={30}
                            activeColor="white"
                            inactiveColor="gray"
                            style={{
                                position: 'absolute',
                                right: 10,
                                top: computedImageHeight / 2 - 15,
                            }}
                        />
                    </>
                )}
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
