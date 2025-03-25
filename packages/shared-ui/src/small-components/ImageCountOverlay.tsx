// ImageCountOverlay.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type ImageCountOverlayProps = {
    currentIndex: number;
    total: number;
};

export const ImageCountOverlay: React.FC<ImageCountOverlayProps> = ({
    currentIndex,
    total,
}) => {
    // Only render the overlay if there is more than one image.
    if (total <= 1) {
        return undefined;
    }

    return (
        <View style={styles.overlay}>
            <Text style={styles.text}>
                {currentIndex + 1} / {total}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    text: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
