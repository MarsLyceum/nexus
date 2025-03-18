import React, { useState } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LargeImageModal } from '../sections';

export type ImagePreviewProps = {
    url: string;
    containerWidth?: number;
    imageDimensions?: { width: number; height: number };
};

export const ImagePreview: React.FC<ImagePreviewProps> = ({
    url,
    containerWidth,
    imageDimensions,
}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const baseContainerWidth = containerWidth || 360;
    const targetWidth =
        baseContainerWidth < 360 ? baseContainerWidth * 0.85 : 360;
    const computedHeight = imageDimensions
        ? targetWidth * (imageDimensions.height / imageDimensions.width)
        : 150;

    return (
        <>
            <Pressable
                onPress={() => setModalVisible(true)}
                style={styles.linkPreviewContainer}
            >
                <ExpoImage
                    source={{ uri: url }}
                    style={{
                        width: targetWidth,
                        height: computedHeight,
                        marginBottom: 5,
                        borderRadius: 8,
                    }}
                    contentFit="contain"
                />
            </Pressable>
            <LargeImageModal
                visible={modalVisible}
                attachments={[url]}
                initialIndex={0}
                onClose={() => setModalVisible(false)}
            />
        </>
    );
};

const styles = StyleSheet.create({
    linkPreviewContainer: {
        borderWidth: 0,
        borderColor: '#ccc',
        padding: 10,
        marginVertical: 5,
        borderRadius: 8,
    },
});
