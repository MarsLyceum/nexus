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

    // Ensure image is ready to be rendered.
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
    // Calculate the margins (offsets) around the centered image.
    const offsetX = (screenWidth - size.width) / 2;
    const offsetY = (screenHeight - size.height) / 2;

    const handleZoomTap = useCallback(
        (e: any) => {
            // Extract x and y coordinates directly from the event.
            const { x, y } = e;

            // Attempt to use the visible rect of the zoomed image.
            if (
                zoomRef.current &&
                typeof zoomRef.current.getVisibleRect === 'function'
            ) {
                const rect = zoomRef.current.getVisibleRect();
                if (
                    x < rect.x ||
                    x > rect.x + rect.width ||
                    y < rect.y ||
                    y > rect.y + rect.height
                ) {
                    e.stopPropagation?.();
                    onClose();
                    return;
                }
            } else {
                // Fallback: use computed image bounds (centered image).
                if (
                    x < offsetX ||
                    x > offsetX + size.width ||
                    y < offsetY ||
                    y > offsetY + size.height
                ) {
                    e.stopPropagation?.();
                    onClose();
                    return;
                }
            }
            // Otherwise, let ResumableZoom handle the tap as usual.
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
                    tapsEnabled
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
