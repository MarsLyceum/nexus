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
import { COLORS } from '../constants';

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
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const deviceWidth = Dimensions.get('window').width;
    const deviceHeight = Dimensions.get('window').height;
    const carouselHeight = deviceHeight * 0.8;
    const carouselRef = useRef<any>(null);

    // When modal becomes visible, reset the carousel to the initial index.
    useEffect(() => {
        if (visible && carouselRef.current) {
            carouselRef.current.scrollTo({
                index: initialIndex,
                animated: false,
            });
            setCurrentIndex(initialIndex);
        }
    }, [visible, initialIndex, attachments]);

    // Web keyboard navigation.
    useEffect(() => {
        if (!visible || Platform.OS !== 'web') return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (attachments.length > 1) {
                if (
                    e.key === 'ArrowRight' &&
                    currentIndex < attachments.length - 1
                ) {
                    console.log('Navigating to next image:', currentIndex + 1);
                    carouselRef.current &&
                        carouselRef.current.scrollTo({
                            index: currentIndex + 1,
                            animated: true,
                        });
                } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
                    console.log(
                        'Navigating to previous image:',
                        currentIndex - 1
                    );
                    carouselRef.current &&
                        carouselRef.current.scrollTo({
                            index: currentIndex - 1,
                            animated: true,
                        });
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [visible, attachments.length, currentIndex]);

    // Render each image item with error handling.
    const renderItem = ({ item }: { item: string }) => {
        console.log('Rendering image:', item);
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
                    <Carousel
                        ref={carouselRef}
                        data={attachments}
                        renderItem={renderItem}
                        width={deviceWidth * 0.9}
                        height={carouselHeight}
                        defaultIndex={initialIndex}
                        onSnapToItem={(index: number) => {
                            console.log('Snapped to index:', index);
                            setCurrentIndex(index);
                        }}
                    />
                    {/* Arrow buttons */}
                    {attachments.length > 1 && (
                        <View
                            style={styles.arrowsContainer}
                            pointerEvents="box-none"
                        >
                            <ArrowButton
                                direction="left"
                                onPress={() => {
                                    console.log('Left arrow pressed');
                                    carouselRef.current &&
                                        carouselRef.current.scrollTo({
                                            index: currentIndex - 1,
                                            animated: true,
                                        });
                                }}
                                disabled={currentIndex === 0}
                                iconSize={30}
                                activeColor={COLORS.White}
                                inactiveColor={COLORS.InactiveText}
                                style={styles.navButton}
                            />
                            <ArrowButton
                                direction="right"
                                onPress={() => {
                                    console.log('Right arrow pressed');
                                    carouselRef.current &&
                                        carouselRef.current.scrollTo({
                                            index: currentIndex + 1,
                                            animated: true,
                                        });
                                }}
                                disabled={
                                    currentIndex === attachments.length - 1
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
                {attachments.length > 1 && (
                    <Pressable style={styles.dotsWrapper} onPress={onClose}>
                        <CarouselDots
                            totalItems={attachments.length}
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
