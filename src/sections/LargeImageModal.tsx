// LargeImageModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    View,
    Platform,
    Dimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import Carousel from 'react-native-reanimated-carousel';
import { ArrowButton } from './ArrowButton';
import { CarouselDots } from './CarouselDots';
import { ImageCountOverlay } from '../small-components';
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
    // Always call hooks in the same order
    const mediaTypes = useMediaTypes(attachments);

    // Filter out any attachments that are videos.
    const imageAttachments = attachments.filter((url) => {
        const type = mediaTypes[url];
        // If media type is undefined, we assume it's an image.
        return type === 'image' || type === undefined;
    });

    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const deviceWidth = Dimensions.get('window').width;
    const deviceHeight = Dimensions.get('window').height;
    const carouselHeight = deviceHeight * 0.8;
    const carouselRef = useRef<any>(null);

    // Adjust the initial index in case the original index pointed to a video.
    const effectiveInitialIndex =
        imageAttachments.length > 0
            ? Math.min(initialIndex, imageAttachments.length - 1)
            : 0;

    // When modal becomes visible, reset the carousel to the effective initial index.
    useEffect(() => {
        if (visible && carouselRef.current) {
            carouselRef.current.scrollTo({
                index: effectiveInitialIndex,
                animated: false,
            });
            setCurrentIndex(effectiveInitialIndex);
        }
    }, [visible, effectiveInitialIndex, imageAttachments]);

    // Web keyboard navigation.
    useEffect(() => {
        if (!visible || Platform.OS !== 'web') return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (imageAttachments.length > 1) {
                if (
                    e.key === 'ArrowRight' &&
                    currentIndex < imageAttachments.length - 1
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
    }, [visible, imageAttachments.length, currentIndex]);

    // Render each carousel item (only images).
    const renderItem = ({ item }: { item: string }) => (
        <ExpoImage
            source={{ uri: item }}
            style={styles.modalImage}
            resizeMode="contain"
            onError={(error) => console.error('Image load error:', item, error)}
        />
    );

    // Now, in the return block we conditionally render null if there are no images.
    if (imageAttachments.length === 0) {
        return null;
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            {/* Outer Pressable dismisses modal on press */}
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <View style={styles.centeredContent} pointerEvents="box-none">
                    <View style={styles.carouselContainer}>
                        <Carousel
                            ref={carouselRef}
                            data={imageAttachments}
                            renderItem={renderItem}
                            width={deviceWidth * 0.9}
                            height={carouselHeight}
                            defaultIndex={effectiveInitialIndex}
                            onSnapToItem={(index: number) => {
                                setCurrentIndex(index);
                            }}
                        />
                        {/* Image Count Overlay */}
                        <ImageCountOverlay
                            currentIndex={currentIndex}
                            total={imageAttachments.length}
                        />
                    </View>
                    {/* Arrow buttons */}
                    {imageAttachments.length > 1 && (
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
                                    currentIndex === imageAttachments.length - 1
                                }
                                iconSize={30}
                                activeColor={COLORS.White}
                                inactiveColor={COLORS.InactiveText}
                                style={styles.navButton}
                            />
                        </View>
                    )}
                </View>
                {/* Carousel dots area */}
                {imageAttachments.length > 1 && (
                    <Pressable style={styles.dotsWrapper} onPress={onClose}>
                        <CarouselDots
                            totalItems={imageAttachments.length}
                            currentIndex={currentIndex}
                            containerStyle={styles.dotsContainer}
                            dotStyle={styles.dot}
                            activeDotStyle={styles.activeDot}
                        />
                    </Pressable>
                )}
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    carouselContainer: {
        position: 'relative',
        width: Dimensions.get('window').width * 0.9,
        height: Dimensions.get('window').height * 0.8,
    },
    modalImage: {
        width: '100%',
        height: '100%',
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
