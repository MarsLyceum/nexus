import React, { useState, useEffect, useCallback } from 'react';
import { Modal, TouchableOpacity, Image, StyleSheet, View } from 'react-native';
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
    const hasMultipleAttachments = attachments.length > 1;

    // Sync current index when modal is opened with a new initialIndex
    useEffect(() => {
        if (visible) {
            setCurrentIndex(initialIndex);
        }
    }, [visible, initialIndex]);

    const handleNext = useCallback(() => {
        if (currentIndex < attachments.length - 1) {
            setCurrentIndex((prevIndex) => prevIndex + 1);
        }
    }, [currentIndex, attachments.length]);

    const handlePrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex((prevIndex) => prevIndex - 1);
        }
    }, [currentIndex]);

    // Keyboard event handling for arrow keys
    useEffect(() => {
        if (!visible) return; // only attach when modal is visible

        const handleKeyDown = (e: KeyboardEvent) => {
            if (hasMultipleAttachments) {
                if (e.key === 'ArrowRight') {
                    handleNext();
                } else if (e.key === 'ArrowLeft') {
                    handlePrev();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        // Cleanup: remove event listener when modal is hidden or component unmounts
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [visible, handleNext, handlePrev, hasMultipleAttachments]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity style={styles.modalOverlay} onPress={onClose}>
                <View
                    style={styles.modalContent}
                    onStartShouldSetResponder={() => true}
                >
                    <Image
                        source={{ uri: attachments[currentIndex] }}
                        style={styles.modalImage}
                        resizeMode="contain"
                    />
                    {hasMultipleAttachments && (
                        <View style={styles.navigationContainer}>
                            <ArrowButton
                                direction="left"
                                onPress={handlePrev}
                                disabled={currentIndex === 0}
                                iconSize={30}
                                activeColor={COLORS.White}
                                inactiveColor={COLORS.InactiveText}
                                style={styles.navButton}
                            />
                            <ArrowButton
                                direction="right"
                                onPress={handleNext}
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
                    {hasMultipleAttachments && (
                        <CarouselDots
                            totalItems={attachments.length}
                            currentIndex={currentIndex}
                            containerStyle={styles.dotsContainer}
                            dotStyle={styles.dot}
                            activeDotStyle={styles.activeDot}
                        />
                    )}
                </View>
            </TouchableOpacity>
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
    modalContent: {
        width: '90%',
        height: '90%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalImage: {
        width: '100%',
        height: '80%',
    },
    navigationContainer: {
        position: 'absolute',
        top: '45%',
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
    },
    navButton: {
        padding: 10,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
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
