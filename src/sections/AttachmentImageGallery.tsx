import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    LayoutChangeEvent,
    ScrollView,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { CarouselDots } from './CarouselDots';
import { ArrowButton } from './ArrowButton';
import { ImageCountOverlay, NexusVideo } from '../small-components';
import { useMediaTypes } from '../hooks';

export type AttachmentImageGalleryProps = {
    attachmentUrls: string[];
    onImagePress: (index: number) => void;
};

export const AttachmentImageGallery: React.FC<AttachmentImageGalleryProps> = ({
    attachmentUrls,
    onImagePress,
}) => {
    const [currentAttachmentIndex, setCurrentAttachmentIndex] = useState(0);
    const [containerWidth, setContainerWidth] = useState(480); // Default fallback width
    const [imageAspectRatio, setImageAspectRatio] = useState(1); // Default ratio (square)

    const scrollViewRef = useRef<ScrollView>(null);
    const isDesktop = containerWidth > 768;

    const handleContainerLayout = (event: LayoutChangeEvent) => {
        const { width } = event.nativeEvent.layout;
        setContainerWidth(width);
    };

    // Use 360 as a fallback width if container width is larger than 360.
    const imageWidth = containerWidth < 360 ? containerWidth : 360;
    const computedImageHeight = imageWidth / imageAspectRatio;

    // Use the updated hook to get media info (type, width, height, aspectRatio) for each URL.
    const mediaInfos = useMediaTypes(attachmentUrls);

    // Update container's aspect ratio based on the current attachment's media info.
    useEffect(() => {
        const currentUrl = attachmentUrls[currentAttachmentIndex];
        const info = mediaInfos[currentUrl];
        if (currentUrl && info) {
            setImageAspectRatio(info.aspectRatio);
        }
    }, [attachmentUrls, currentAttachmentIndex, mediaInfos]);

    const handleMomentumScrollEnd = (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const newIndex = Math.round(offsetX / imageWidth);
        setCurrentAttachmentIndex(newIndex);
    };

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
                    {attachmentUrls.map((url, index) => {
                        // Get the media info for this URL.
                        const info = mediaInfos[url];
                        // Compute the height for this attachment based on its aspect ratio.
                        const attachmentHeight = info
                            ? imageWidth / info.aspectRatio
                            : computedImageHeight;
                        return (
                            <TouchableOpacity
                                key={index}
                                onPress={() => onImagePress(index)}
                                activeOpacity={0.8}
                            >
                                {info && info.type === 'video' ? (
                                    <NexusVideo
                                        source={{ uri: url }}
                                        style={[
                                            styles.galleryImage,
                                            {
                                                width: imageWidth,
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
                                                width: imageWidth,
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
