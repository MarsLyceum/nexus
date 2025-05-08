import React, { useRef, useCallback, useMemo, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import {
    ResumableZoom,
    type ResumableZoomType,
    useImageResolution,
} from 'react-native-zoom-toolkit';

import { useGifPlayer } from '../../hooks';
import { GifPlayer } from '../GifPlayer';
import { GifPlayerControls } from '../GifPlayerControls';
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
    const [controlsRect, setControlsRect] = useState<
        | {
              left: number;
              top: number;
              right: number;
              bottom: number;
          }
        | undefined
    >();
    const controlsRef = useRef<View | undefined>();

    const isGif = useMemo(() => uri.toLowerCase().endsWith('.gif'), [uri]);
    const {
        position,
        playing,
        totalDuration,
        togglePlay,
        onSlidingStart,
        onValueChange,
        onSlidingComplete,
    } = useGifPlayer(uri);

    const handleLayoutControls = useCallback(() => {
        if (
            controlsRef.current &&
            typeof controlsRef.current.measure === 'function'
        ) {
            controlsRef.current.measure((fx, fy, width, height, px, py) => {
                setControlsRect({
                    left: px,
                    top: py,
                    right: px + width,
                    bottom: py + height,
                });
            });
        }
    }, []);

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                    if (
                        isGif &&
                        controlsRect &&
                        (localX < controlsRect.left ||
                            localX > controlsRect.right ||
                            localY < controlsRect.top ||
                            localY > controlsRect.bottom)
                    ) {
                        e.stopPropagation?.();
                        onClose();
                    }
                    if (!isGif) {
                        e.stopPropagation?.();
                        onClose();
                    }
                }
            } else if (
                absoluteY < offsetY ||
                absoluteY > offsetY + imageHeight
            ) {
                e.stopPropagation?.();
                onClose();
            }
        },
        [onClose, offsetY, imageHeight, controlsRect, isGif]
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
                    {isGif ? (
                        <GifPlayer
                            source={uri}
                            width={imageWidth}
                            height={imageHeight}
                            position={position}
                        />
                    ) : (
                        <NexusImage
                            source={uri}
                            style={{ width: imageWidth, height: imageHeight }}
                            contentFit="contain"
                            width={imageWidth}
                            height={imageHeight}
                            alt="Mobile image preview"
                        />
                    )}
                </ResumableZoom>
            ) : (
                <View style={{ flex: 1 }} />
            )}
            {isGif && (
                <GifPlayerControls
                    playing={playing}
                    position={position}
                    totalDuration={totalDuration}
                    onTogglePlay={togglePlay}
                    onSlidingStart={onSlidingStart}
                    onValueChange={onValueChange}
                    onSlidingComplete={onSlidingComplete}
                    // @ts-expect-error ref
                    ref={controlsRef}
                    onLayout={handleLayoutControls}
                />
            )}
        </View>
    );
};
