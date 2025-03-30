import React, { useRef, useCallback } from 'react';
import { View, useWindowDimensions } from 'react-native';
import {
    ResumableZoom,
    type ResumableZoomType,
    useImageResolution,
} from 'react-native-zoom-toolkit';

import { NexusImage } from '../NexusImage';

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
    const aspectRatio = ready ? resolution.width / resolution.height : 1;

    // Compute image dimensions: full screen width and height based on aspect ratio.
    const imageWidth = screenWidth;
    const imageHeight = screenWidth / aspectRatio;

    // Calculate vertical offset for centering the image.
    const offsetY = (screenHeight - imageHeight) / 2;

    const handleZoomTap = useCallback(
        (e: any) => {
            const { absoluteX, absoluteY } = e;

            if (
                zoomRef.current &&
                typeof zoomRef.current.getVisibleRect === 'function'
            ) {
                const rect = zoomRef.current.getVisibleRect();
                // Since the image is full width, horizontal offset is zero.
                const localX = absoluteX;
                const localY = absoluteY - offsetY;

                if (
                    localX < rect.x ||
                    localX > rect.x + rect.width ||
                    localY < rect.y ||
                    localY > rect.y + rect.height
                ) {
                    e.stopPropagation?.();
                    onClose();
                }
            } else {
                if (absoluteY < offsetY || absoluteY > offsetY + imageHeight) {
                    e.stopPropagation?.();
                    onClose();
                }
            }
        },
        [onClose, offsetY, imageHeight]
    );

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: 'black',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            {ready ? (
                <ResumableZoom
                    ref={zoomRef}
                    minScale={1}
                    maxScale={6}
                    scaleMode="clamp"
                    allowPinchPanning
                    extendGestures
                    onTap={handleZoomTap}
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    tapsEnabled
                >
                    <NexusImage
                        source={uri}
                        style={{ width: imageWidth, height: imageHeight }}
                        contentFit="contain"
                        width={imageWidth}
                        height={imageHeight}
                        alt="Mobile image preview"
                    />
                </ResumableZoom>
            ) : (
                <View style={{ flex: 1 }} />
            )}
        </View>
    );
};
