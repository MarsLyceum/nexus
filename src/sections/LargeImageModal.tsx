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

    // Use all attachments to preserve the original order.
    const mediaAttachments = attachments;

    // Render each carousel item based on media type.
    const renderItem = ({ item }: { item: string }) => {
        const info = mediaInfos[item];
        if (info && info.type === 'video') {
            // If the attachment is a video, play it using NexusVideo.
            return (
                <NexusVideo
                    source={{ uri: item }}
                    style={styles.modalImage}
                    muted={false}
                    repeat
                    paused={false}
                    contentFit="contain"
                    controls
                />
            );
        }
        return (
            <ExpoImage
                source={{ uri: item }}
                style={styles.modalImage}
                resizeMode="contain"
                onError={(error) =>
                    console.error('Image load error:', item, error)
                }
            />
        );
    };

    // Determine the effective initial index.
    const effectiveInitialIndex =
        mediaAttachments.length > 0
            ? Math.min(initialIndex, mediaAttachments.length - 1)
            : 0;

    const [currentIndex, setCurrentIndex] = useState(effectiveInitialIndex);
    const deviceWidth = Dimensions.get('window').width;
    const deviceHeight = Dimensions.get('window').height;
    const carouselHeight = deviceHeight * 0.8;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const carouselRef = useRef<any>(null);

    // Reset the carousel to the effective initial index when the modal becomes visible.
    useEffect(() => {
        if (visible && carouselRef.current) {
            carouselRef.current.scrollTo({
                index: effectiveInitialIndex,
                animated: false,
            });
            setCurrentIndex(effectiveInitialIndex);
        }
    }, [visible, effectiveInitialIndex, mediaAttachments]);

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
        // eslint-disable-next-line consistent-return
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [visible, mediaAttachments.length, currentIndex]);

    if (mediaAttachments.length === 0) {
        return undefined;
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
                            data={mediaAttachments}
                            renderItem={renderItem}
                            width={deviceWidth * 0.9}
                            height={carouselHeight}
                            defaultIndex={effectiveInitialIndex}
                            onSnapToItem={(index: number) =>
                                setCurrentIndex(index)
                            }
                        />
                        {/* Media Count Overlay */}
                        <ImageCountOverlay
                            currentIndex={currentIndex}
                            total={mediaAttachments.length}
                        />
                    </View>
                    {/* Arrow buttons */}
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
                                    currentIndex === mediaAttachments.length - 1
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
                {mediaAttachments.length > 1 && (
                    <Pressable style={styles.dotsWrapper} onPress={onClose}>
                        <CarouselDots
                            totalItems={mediaAttachments.length}
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
