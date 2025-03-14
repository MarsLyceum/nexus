import React, { useRef, useCallback } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import {
    ResumableZoom,
    type ResumableZoomType,
    fitContainer,
    useImageResolution,
} from 'react-native-zoom-toolkit';

export type MobileImageRendererProps = {
    uri: string;
    onClose: () => void;
};

export const MobileImageRenderer: React.FC<MobileImageRendererProps> = ({
    uri,
    onClose,
}) => {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const { isFetching, resolution } = useImageResolution({ uri });
    const zoomRef = useRef<ResumableZoomType>(null);

    // Instead of early return, use a ready flag.
    const ready =
        !isFetching &&
        resolution &&
        resolution.width !== 0 &&
        resolution.height !== 0;

    // Compute aspect ratio (fallback to 1 if not ready)
    const aspectRatio = ready ? resolution!.width / resolution!.height : 1;
    const size = fitContainer(aspectRatio, {
        width: screenWidth,
        height: screenHeight,
    });
    // Calculate offsets (empty margins) around the centered image.
    const offsetX = (screenWidth - size.width) / 2;
    const offsetY = (screenHeight - size.height) / 2;

    const handleZoomTap = useCallback(
        (e: any) => {
            if (!e || !e.nativeEvent) return;
            const { locationX, locationY } = e.nativeEvent;
            // If the tap is outside the visible image area, stop propagation and dismiss.
            if (
                locationX < offsetX ||
                locationX > offsetX + size.width ||
                locationY < offsetY ||
                locationY > offsetY + size.height
            ) {
                if (e.stopPropagation) {
                    e.stopPropagation();
                }
                onClose();
            }
        },
        [onClose, offsetX, offsetY, size.width, size.height]
    );

    return (
        <View style={{ flex: 1 }}>
            {ready ? (
                <ResumableZoom
                    ref={zoomRef}
                    minScale={1}
                    maxScale={6}
                    scaleMode="clamp"
                    allowPinchPanning
                    extendGestures
                    onTap={handleZoomTap}
                    style={{ flex: 1 }}
                    tapsEnabled={true}
                >
                    <ExpoImage
                        source={{ uri }}
                        style={size}
                        contentFit="contain"
                    />
                </ResumableZoom>
            ) : (
                <View style={{ flex: 1, backgroundColor: 'black' }} />
            )}
        </View>
    );
};
