import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { CarouselDots } from './CarouselDots';
import { ArrowButton } from './ArrowButton';
import { ImageCountOverlay, NexusVideo } from '../small-components';
import { useMediaTypes } from '../hooks';

export type AttachmentImageGalleryProps = {
    attachmentUrls: string[];
    onImagePress: (index: number) => void;
    containerWidth: number;
};

export const AttachmentImageGallery: React.FC<AttachmentImageGalleryProps> = ({
    attachmentUrls,
    onImagePress,
    containerWidth,
}) => {
    const [currentAttachmentIndex, setCurrentAttachmentIndex] = useState(0);
    const [imageAspectRatio, setImageAspectRatio] = useState(1); // Default to square

    const scrollViewRef = useRef<ScrollView>(null);
    const isDesktop = containerWidth > 768;

    // Compute target dimensions based on the container's width,
    // mimicking the ImagePreview component logic.
    const baseContainerWidth = containerWidth || 360;
    const targetWidth =
        baseContainerWidth < 360 ? baseContainerWidth * 0.85 : 360;
    const computedImageHeight = imageAspectRatio
        ? targetWidth / imageAspectRatio
        : 150;

    // Retrieve media information for each attachment.
    const mediaInfos = useMediaTypes(attachmentUrls);

    // Update the aspect ratio based on the current attachment's media info.
    useEffect(() => {
        const currentUrl = attachmentUrls[currentAttachmentIndex];
        const info = mediaInfos[currentUrl];
        if (currentUrl && info) {
            setImageAspectRatio(info.aspectRatio);
        }
    }, [attachmentUrls, currentAttachmentIndex, mediaInfos]);

    // Calculate new index based on the scroll offset using targetWidth.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMomentumScrollEnd = (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const newIndex = Math.round(offsetX / targetWidth);
        setCurrentAttachmentIndex(newIndex);
    };

    const goToIndex = (newIndex: number) => {
        setCurrentAttachmentIndex(newIndex);
        scrollViewRef.current?.scrollTo({
            x: newIndex * targetWidth,
            animated: true,
        });
    };

    return (
        // Ensure the outer container takes full width.
        <View style={{ width: '100%' }}>
            <View
                style={[
                    styles.imageContainer,
                    { width: targetWidth, height: computedImageHeight },
                ]}
            >
                <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={handleMomentumScrollEnd}
                    contentContainerStyle={{
                        width: targetWidth * attachmentUrls.length,
                    }}
                    ref={scrollViewRef}
                >
                    {attachmentUrls.map((url, index) => {
                        // Retrieve media info for the image.
                        const info = mediaInfos[url];
                        // Compute the height for this image.
                        const attachmentHeight = info
                            ? targetWidth / info.aspectRatio
                            : computedImageHeight;
                        // Check if the media is a video.
                        const isVideo = info && info.type === 'video';
                        return (
                            <TouchableOpacity
                                key={index}
                                // Allow onPress for images (not videos).
                                onPress={
                                    !isVideo
                                        ? () => onImagePress(index)
                                        : undefined
                                }
                                activeOpacity={!isVideo ? 0.8 : 1}
                            >
                                {isVideo ? (
                                    <NexusVideo
                                        source={{ uri: url }}
                                        style={[
                                            styles.galleryImage,
                                            {
                                                width: targetWidth,
                                                height: attachmentHeight,
                                            },
                                        ]}
                                        muted={false}
                                        repeat
                                        paused
                                        contentFit="contain"
                                    />
                                ) : (
                                    <ExpoImage
                                        source={{ uri: url }}
                                        style={[
                                            styles.galleryImage,
                                            {
                                                width: targetWidth,
                                                height: attachmentHeight,
                                            },
                                        ]}
                                    />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <ImageCountOverlay
                    currentIndex={currentAttachmentIndex}
                    total={attachmentUrls.length}
                />

                {isDesktop && attachmentUrls.length > 1 && (
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
        alignSelf: 'center',
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
