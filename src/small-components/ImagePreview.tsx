// components/ImagePreview.tsx

import React from 'react';
import { TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

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
    const baseContainerWidth = containerWidth || 360;
    const targetWidth =
        baseContainerWidth < 360 ? baseContainerWidth * 0.85 : 360;
    const computedHeight = imageDimensions
        ? targetWidth * (imageDimensions.height / imageDimensions.width)
        : 150;

    return (
        <TouchableOpacity
            onPress={() => Linking.openURL(url)}
            style={styles.linkPreviewContainer}
        >
            <ExpoImage
                source={{ uri: url }}
                style={{
                    width: targetWidth,
                    height: computedHeight,
                    marginBottom: 5,
                }}
                contentFit="contain"
            />
        </TouchableOpacity>
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
