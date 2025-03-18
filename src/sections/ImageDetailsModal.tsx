import React, { useState, useEffect, useRef } from 'react';
import { Modal, StyleSheet, View, Dimensions } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

import { isComputer as isComputerUtil } from '../utils';
import { ImageCountOverlay, ItemRenderer } from '../small-components';
import { useMediaTypes } from '../hooks';

import { ArrowButton } from './ArrowButton';
import { CarouselDots } from './CarouselDots';

export type ImageDetailsModalProps = {
    visible: boolean;
    attachments: string[];
    initialIndex: number;
    onClose: () => void;
};

export const ImageDetailsModal: React.FC<ImageDetailsModalProps> = ({
    visible,
    attachments,
    initialIndex,
    onClose,
}) => {
    const isComputer = isComputerUtil();
    const mediaInfos = useMediaTypes(attachments);
    const mediaAttachments = attachments;
    const effectiveInitialIndex =
        mediaAttachments.length > 0
            ? Math.min(initialIndex, mediaAttachments.length - 1)
            : 0;
    const [currentIndex, setCurrentIndex] = useState(effectiveInitialIndex);
    const carouselRef = useRef<any>(null);
    const deviceWidth = Dimensions.get('window').width;
    const deviceHeight = Dimensions.get('window').height;
    // For web, use 80% of the screen; for mobile, fill the screen.
    const containerWidth = isComputer ? deviceWidth * 0.8 : deviceWidth;
    const containerHeight = isComputer ? deviceHeight * 0.8 : deviceHeight;

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
        if (!visible || !isComputer) return;
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
    }, [visible, mediaAttachments.length, currentIndex, isComputer]);

    if (mediaAttachments.length === 0) return null;

    const renderItem = ({ item }: { item: string }) => {
        const info = mediaInfos[item];
        // Use a unique key based on the item URI and its media type.
        const key = item + '_' + (info ? info.type : 'unknown');
        return (
            <View key={key} style={{ width: '100%', height: '100%' }}>
                <ItemRenderer
                    item={item}
                    isComputer={isComputer}
                    mediaInfo={info}
                    containerWidth={containerWidth}
                    containerHeight={containerHeight}
                    onClose={onClose}
                />
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
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
                                    activeColor="#fff"
                                    inactiveColor="#aaa"
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
                                    activeColor="#fff"
                                    inactiveColor="#aaa"
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
            </View>
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
    contentWrapper: {
        alignItems: 'center',
    },
    carouselContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
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
        backgroundColor: '#aaa',
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: '#fff',
    },
});
