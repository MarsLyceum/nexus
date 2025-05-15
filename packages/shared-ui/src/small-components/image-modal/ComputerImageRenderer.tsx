import React, {
    useState,
    useRef,
    useCallback,
    useEffect,
    useMemo,
} from 'react';
import { View, Pressable, Platform } from 'react-native';
import { useImageResolution, fitContainer } from 'react-native-zoom-toolkit';

import { useGifPlayer } from '../../hooks';
import { NexusImage } from '../NexusImage';
import { GifPlayer } from '../GifPlayer';
import { MediaPlayerControls } from '../MediaPlayerControls';

export type ComputerImageRendererProps = {
    uri: string;
    containerWidth: number;
    containerHeight: number;
    onClose: () => void;
};

export const ComputerImageRenderer: React.FC<ComputerImageRendererProps> = ({
    uri,
    containerWidth,
    containerHeight,
    onClose,
}) => {
    const [zoomed, setZoomed] = useState(false);

    const {
        position,
        playing,
        totalDuration,
        togglePlay,
        onSlidingStart,
        onValueChange,
        onSlidingComplete,
    } = useGifPlayer(uri);

    // Compute the aspect ratio using image resolution.
    const { resolution } = useImageResolution({ uri });
    const aspectRatio = useMemo(
        () =>
            resolution && resolution.width && resolution.height
                ? resolution.width / resolution.height
                : 1,
        [resolution]
    );

    const isGif = useMemo(() => uri.toLowerCase().endsWith('.gif'), [uri]);

    // Compute the non-zoomed (visible) image size.
    const nonZoomedSize = useMemo(
        () =>
            fitContainer(aspectRatio, {
                width: containerWidth,
                height: containerHeight,
            }),
        [aspectRatio, containerWidth, containerHeight]
    );

    // Fixed zoom factor.
    const zoomFactor = 2.5;
    const zoomedContainerWidth = containerWidth * zoomFactor;
    const zoomedContainerHeight = containerHeight * zoomFactor;
    const zoomedSize = useMemo(
        () =>
            fitContainer(aspectRatio, {
                width: zoomedContainerWidth,
                height: zoomedContainerHeight,
            }),
        [aspectRatio, zoomedContainerWidth, zoomedContainerHeight]
    );

    const scrollRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (zoomed && Platform.OS === 'web' && scrollRef.current) {
            // compute the offsets to center
            const x = (zoomedContainerWidth - containerWidth) / 2;
            const y = (zoomedContainerHeight - containerHeight) / 2;

            // scroll the <div> itself:
            scrollRef.current.scrollLeft = x;
            scrollRef.current.scrollTop = y;
        }
    }, [
        zoomed,
        zoomedContainerWidth,
        zoomedContainerHeight,
        containerWidth,
        containerHeight,
    ]);

    // Measure the visible image area using onLayout.
    const [visibleRect, setVisibleRect] = useState<
        | {
              left: number;
              top: number;
              right: number;
              bottom: number;
          }
        | undefined
    >();
    const [controlsRect, setControlsRect] = useState<
        | {
              left: number;
              top: number;
              right: number;
              bottom: number;
          }
        | undefined
    >();
    const imageWrapperRef = useRef<View | undefined>();
    const controlsRef = useRef<View | undefined>();

    const handleLayout = useCallback(() => {
        if (
            imageWrapperRef.current &&
            typeof imageWrapperRef.current.measure === 'function'
        ) {
            imageWrapperRef.current.measure((fx, fy, width, height, px, py) => {
                setVisibleRect({
                    left: px,
                    top: py,
                    right: px + width,
                    bottom: py + height,
                });
            });
        }
    }, []);

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

    // Attach a document-level mousedown listener to dismiss the modal if clicking outside.
    useEffect(() => {
        if (!visibleRect || (isGif && !controlsRect)) return;
        const handleDocumentClick = (event: MouseEvent) => {
            const { clientX, clientY } = event;
            if (
                clientX < visibleRect.left ||
                clientX > visibleRect.right ||
                clientY < visibleRect.top ||
                clientY > visibleRect.bottom
            ) {
                if (
                    isGif &&
                    controlsRect &&
                    (clientX < controlsRect.left ||
                        clientX > controlsRect.right ||
                        clientY < controlsRect.top ||
                        clientY > controlsRect.bottom)
                ) {
                    onClose();
                }
                if (!isGif) {
                    onClose();
                }
            }
        };
        document.addEventListener('mousedown', handleDocumentClick);
        // eslint-disable-next-line consistent-return
        return () => {
            document.removeEventListener('mousedown', handleDocumentClick);
        };
    }, [visibleRect, controlsRect, onClose]);

    // Toggle zoom state on image press.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleImagePress = useCallback((e: any) => {
        e.stopPropagation();
        setZoomed((prev) => !prev);
    }, []);

    if (!zoomed) {
        // Non-zoomed state: render image centered with a "zoom-in" cursor.
        return (
            <View
                style={{
                    width: containerWidth,
                    height: containerHeight,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Pressable
                    onPress={handleImagePress}
                    // @ts-expect-error styles
                    style={{
                        width: nonZoomedSize.width,
                        height: nonZoomedSize.height,
                        cursor: 'zoom-in',
                    }}
                    // @ts-expect-error ref
                    ref={imageWrapperRef}
                    onLayout={handleLayout}
                >
                    {isGif ? (
                        <GifPlayer
                            source={uri}
                            width={nonZoomedSize.width}
                            height={nonZoomedSize.height}
                            position={position}
                            playing={playing}
                        />
                    ) : (
                        <NexusImage
                            source={uri}
                            contentFit="cover"
                            width={nonZoomedSize.width}
                            height={nonZoomedSize.height}
                            alt="Computer image preview"
                        />
                    )}
                </Pressable>
                {isGif && (
                    <MediaPlayerControls
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
    }

    // Zoomed state: render image inside a ScrollView (vertical scrolling enabled).
    return (
        <View>
            {/* @ts-expect-error styles */}
            <View
                style={{
                    cursor: 'zoom-out',
                    overflow: 'auto',
                    width: containerWidth,
                    height: containerHeight,
                }}
                ref={scrollRef}
            >
                <View
                    style={{
                        width: zoomedContainerWidth,
                        height: zoomedContainerHeight,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Pressable
                        onPress={handleImagePress}
                        // @ts-expect-error ref
                        ref={imageWrapperRef}
                        onLayout={handleLayout}
                        // @ts-expect-error styles
                        style={{
                            width: zoomedSize.width,
                            height: zoomedSize.height,
                            cursor: 'zoom-out',
                        }}
                    >
                        {isGif ? (
                            <GifPlayer
                                source={uri}
                                width={zoomedSize.width}
                                height={zoomedSize.height}
                                position={position}
                                playing={playing}
                            />
                        ) : (
                            <NexusImage
                                source={uri}
                                contentFit="cover"
                                width={zoomedSize.width}
                                height={zoomedSize.height}
                                alt="Computer image preview zoomed"
                            />
                        )}
                    </Pressable>
                </View>
            </View>

            {isGif && (
                <MediaPlayerControls
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
