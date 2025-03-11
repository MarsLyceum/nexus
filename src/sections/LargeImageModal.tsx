import React, { useState, useEffect, useRef } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    View,
    Platform,
    Dimensions,
    GestureResponderEvent,
    Image as RNImage,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import Carousel from 'react-native-reanimated-carousel';
import { ArrowButton } from './ArrowButton';
import { CarouselDots } from './CarouselDots';
import { ImageCountOverlay, NexusVideo } from '../small-components';
import { COLORS } from '../constants';
import { useMediaTypes } from '../hooks';

type LargeImageModalProps = {
    visible: boolean;
    attachments: string[];
    initialIndex: number;
    onClose: () => void;
};

export const LargeImageModal: React.FC<LargeImageModalProps> = ({
    visible,
    attachments,
    initialIndex,
    onClose,
}) => {
    // Get media type information for all attachments.
    const mediaInfos = useMediaTypes(attachments);
    const mediaAttachments = attachments; // Preserve original order.

    // Determine effective initial index.
    const effectiveInitialIndex =
        mediaAttachments.length > 0
            ? Math.min(initialIndex, mediaAttachments.length - 1)
            : 0;

    // State for the currently visible carousel index.
    const [currentIndex, setCurrentIndex] = useState(effectiveInitialIndex);

    // State to store the actual rendered image layout (computed).
    const [imageLayout, setImageLayout] = useState<{
        x: number;
        y: number;
        width: number;
        height: number;
    } | null>(null);

    // Ref to the carousel.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const carouselRef = useRef<any>(null);

    const deviceWidth = Dimensions.get('window').width;
    const deviceHeight = Dimensions.get('window').height;
    // We use the same dimensions for both the container and the carousel item.
    const containerWidth = deviceWidth * 0.8;
    const containerHeight = deviceHeight * 0.8;

    // Reset carousel to the effective initial index when modal is shown.
    useEffect(() => {
        if (visible && carouselRef.current) {
            carouselRef.current.scrollTo({
                index: effectiveInitialIndex,
                animated: false,
            });
            setCurrentIndex(effectiveInitialIndex);
        }
    }, [visible, effectiveInitialIndex, mediaAttachments]);

    // Compute the actual rendered image dimensions (only for images, not videos).
    useEffect(() => {
        if (mediaAttachments.length === 0) return;
        const currentMediaUrl = mediaAttachments[currentIndex];
        const info = mediaInfos[currentMediaUrl];

        // If it is a video, use full container.
        if (info && info.type === 'video') {
            setImageLayout({
                x: (deviceWidth - containerWidth) / 2,
                y: (deviceHeight - containerHeight) / 2,
                width: containerWidth,
                height: containerHeight,
            });
            return;
        }

        // For images, get intrinsic size and compute rendered dimensions.
        RNImage.getSize(
            currentMediaUrl,
            (intrinsicWidth, intrinsicHeight) => {
                const scale = Math.min(
                    containerWidth / intrinsicWidth,
                    containerHeight / intrinsicHeight
                );
                const renderedWidth = intrinsicWidth * scale;
                const renderedHeight = intrinsicHeight * scale;
                const leftOffset = (containerWidth - renderedWidth) / 2;
                const topOffset = (containerHeight - renderedHeight) / 2;
                setImageLayout({
                    x: (deviceWidth - containerWidth) / 2 + leftOffset,
                    y: (deviceHeight - containerHeight) / 2 + topOffset,
                    width: renderedWidth,
                    height: renderedHeight,
                });
            },
            (error) => {
                console.error('Error getting image size:', error);
            }
        );
    }, [
        currentIndex,
        mediaAttachments,
        mediaInfos,
        deviceWidth,
        deviceHeight,
        containerWidth,
        containerHeight,
    ]);

    // Web keyboard navigation.
    useEffect(() => {
        if (!visible || Platform.OS !== 'web') return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (mediaAttachments.length > 1) {
                if (
                    e.key === 'ArrowRight' &&
                    currentIndex < mediaAttachments.length - 1
                ) {
                    carouselRef?.current.scrollTo({
                        index: currentIndex + 1,
                        animated: true,
                    });
                } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
                    carouselRef?.current.scrollTo({
                        index: currentIndex - 1,
                        animated: true,
                    });
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [visible, mediaAttachments.length, currentIndex]);

    if (mediaAttachments.length === 0) {
        return null;
    }

    // Render each carousel item.
    const renderItem = ({ item, index }: { item: string; index: number }) => {
        const info = mediaInfos[item];
        const content =
            info && info.type === 'video' ? (
                <NexusVideo
                    source={{ uri: item }}
                    style={styles.modalMedia}
                    muted={false}
                    repeat
                    paused
                    contentFit="contain"
                    controls
                />
            ) : (
                <ExpoImage
                    source={{ uri: item }}
                    style={styles.modalMedia}
                    contentFit="contain"
                    onError={(error) =>
                        console.error('Image load error:', item, error)
                    }
                />
            );

        // For the current visible image, just render the content.
        // We no longer use onLayout here because we compute the actual layout separately.
        return <View style={{ width: '100%', height: '100%' }}>{content}</View>;
    };

    // Outer press handler that dismisses the modal only if tap is outside the actual rendered image.
    const handleOuterPress = (e: GestureResponderEvent) => {
        const { pageX, pageY } = e.nativeEvent;
        if (imageLayout) {
            const withinX =
                pageX >= imageLayout.x &&
                pageX <= imageLayout.x + imageLayout.width;
            const withinY =
                pageY >= imageLayout.y &&
                pageY <= imageLayout.y + imageLayout.height;
            if (withinX && withinY) {
                // Tap is inside the image.
                return;
            }
        }
        // Tap outside the image: dismiss the modal.
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            {/* Outer Pressable: Dismisses the modal when tap is outside the measured image */}
            <Pressable style={styles.modalOverlay} onPress={handleOuterPress}>
                <View style={styles.centeredContent}>
                    <View style={styles.contentWrapper}>
                        <View style={styles.carouselContainer}>
                            <Carousel
                                ref={carouselRef}
                                data={mediaAttachments}
                                renderItem={renderItem}
                                width={containerWidth}
                                height={containerHeight}
                                defaultIndex={effectiveInitialIndex}
                                onSnapToItem={(index: number) =>
                                    setCurrentIndex(index)
                                }
                            />
                            <ImageCountOverlay
                                currentIndex={currentIndex}
                                total={mediaAttachments.length}
                            />
                        </View>
                        {mediaAttachments.length > 1 && (
                            <View
                                style={styles.arrowsContainer}
                                pointerEvents="box-none"
                            >
                                <ArrowButton
                                    direction="left"
                                    onPress={() =>
                                        carouselRef?.current.scrollTo({
                                            index: currentIndex - 1,
                                            animated: true,
                                        })
                                    }
                                    disabled={currentIndex === 0}
                                    iconSize={30}
                                    activeColor={COLORS.White}
                                    inactiveColor={COLORS.InactiveText}
                                    style={styles.navButton}
                                />
                                <ArrowButton
                                    direction="right"
                                    onPress={() =>
                                        carouselRef?.current.scrollTo({
                                            index: currentIndex + 1,
                                            animated: true,
                                        })
                                    }
                                    disabled={
                                        currentIndex ===
                                        mediaAttachments.length - 1
                                    }
                                    iconSize={30}
                                    activeColor={COLORS.White}
                                    inactiveColor={COLORS.InactiveText}
                                    style={styles.navButton}
                                />
                            </View>
                        )}
                        {mediaAttachments.length > 1 && (
                            <View style={styles.dotsWrapper}>
                                <CarouselDots
                                    totalItems={mediaAttachments.length}
                                    currentIndex={currentIndex}
                                    containerStyle={styles.dotsContainer}
                                    dotStyle={styles.dot}
                                    activeDotStyle={styles.activeDot}
                                />
                            </View>
                        )}
                    </View>
                </View>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centeredContent: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentWrapper: {
        alignItems: 'center',
    },
    carouselContainer: {
        width: Dimensions.get('window').width * 0.8,
        height: Dimensions.get('window').height * 0.8,
        position: 'relative',
    },
    modalMedia: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    arrowsContainer: {
        position: 'absolute',
        width: '90%',
        top: '50%',
        left: '5%',
        right: '5%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        zIndex: 1,
    },
    navButton: {
        padding: 10,
    },
    dotsWrapper: {
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.InactiveText,
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: COLORS.White,
    },
});
