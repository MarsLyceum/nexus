import React, { useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowButton } from './ArrowButton';
import { CarouselDots } from './CarouselDots';
import { COLORS } from '../constants';

export type AttachmentCarouselProps = {
    attachmentUrls: string[];
    onImagePress: (index: number) => void;
};

export const AttachmentCarousel: React.FC<AttachmentCarouselProps> = ({
    attachmentUrls,
    onImagePress,
}) => {
    const [currentAttachmentIndex, setCurrentAttachmentIndex] = useState(0);

    const handleNextAttachment = () => {
        if (currentAttachmentIndex < attachmentUrls.length - 1) {
            setCurrentAttachmentIndex(currentAttachmentIndex + 1);
        }
    };

    const handlePrevAttachment = () => {
        if (currentAttachmentIndex > 0) {
            setCurrentAttachmentIndex(currentAttachmentIndex - 1);
        }
    };

    const hasMultipleAttachments = attachmentUrls.length > 1;

    return (
        <View>
            <View style={styles.carouselContainer}>
                {hasMultipleAttachments && (
                    <ArrowButton
                        direction="left"
                        onPress={handlePrevAttachment}
                        disabled={currentAttachmentIndex === 0}
                        iconSize={24}
                        activeColor={COLORS.White}
                        inactiveColor={COLORS.InactiveText}
                        style={styles.arrowButton}
                    />
                )}
                <TouchableOpacity
                    onPress={() => onImagePress(currentAttachmentIndex)}
                    activeOpacity={0.8}
                >
                    <Image
                        source={{ uri: attachmentUrls[currentAttachmentIndex] }}
                        style={styles.carouselImage}
                    />
                </TouchableOpacity>
                {hasMultipleAttachments && (
                    <ArrowButton
                        direction="right"
                        onPress={handleNextAttachment}
                        disabled={
                            currentAttachmentIndex === attachmentUrls.length - 1
                        }
                        iconSize={24}
                        activeColor={COLORS.White}
                        inactiveColor={COLORS.InactiveText}
                        style={styles.arrowButton}
                    />
                )}
            </View>
            {hasMultipleAttachments && (
                <CarouselDots
                    totalItems={attachmentUrls.length}
                    currentIndex={currentAttachmentIndex}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    carouselContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    carouselImage: {
        width: 480,
        height: 480,
        borderRadius: 8,
        alignSelf: 'center',
        resizeMode: 'contain',
    },
    arrowButton: {
        padding: 10,
    },
});
