import React, {
    useState,
    useRef,
    useCallback,
    useEffect,
    useMemo,
} from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useImageResolution, fitContainer } from 'react-native-zoom-toolkit';

import { NexusImage } from '../NexusImage';

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

    // Compute the aspect ratio using image resolution.
    const { resolution } = useImageResolution({ uri });
    const aspectRatio = useMemo(
        () =>
            resolution && resolution.width && resolution.height
                ? resolution.width / resolution.height
                : 1,
        [resolution]
    );

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
    const zoomedOffsetX = (zoomedContainerWidth - zoomedSize.width) / 2;
    const zoomedOffsetY = (zoomedContainerHeight - zoomedSize.height) / 2;

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
    const imageWrapperRef = useRef<View | undefined>();

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

    // Attach a document-level mousedown listener to dismiss the modal if clicking outside.
    useEffect(() => {
        if (!visibleRect) return;
        const handleDocumentClick = (event: MouseEvent) => {
            const { clientX, clientY } = event;
            if (
                clientX < visibleRect.left ||
                clientX > visibleRect.right ||
                clientY < visibleRect.top ||
                clientY > visibleRect.bottom
            ) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleDocumentClick);
        return () => {
            document.removeEventListener('mousedown', handleDocumentClick);
        };
    }, [visibleRect, onClose]);

    // Toggle zoom state on image press.
    const handleImagePress = useCallback((e: any) => {
        e.stopPropagation();
        setZoomed((prev) => !prev);
    }, []);

    if (!zoomed) {
        // Non-zoomed state: render image centered with a "zoom-in" cursor.
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Pressable
                    onPress={handleImagePress}
                    style={{
                        width: nonZoomedSize.width,
                        height: nonZoomedSize.height,
                        cursor: 'zoom-in',
                    }}
                    ref={imageWrapperRef}
                    onLayout={handleLayout}
                >
                    <NexusImage
                        source={uri}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="contain"
                        width={nonZoomedSize.width}
                        height={nonZoomedSize.height}
                        alt="Computer image preview"
                    />
                </Pressable>
            </View>
        );
    }

    // Zoomed state: render image inside a ScrollView (vertical scrolling enabled).
    return (
        <View style={{ flex: 1, cursor: 'zoom-out' }}>
            <ScrollView
                style={{ flex: 1, cursor: 'zoom-out' }}
                contentContainerStyle={{
                    width: zoomedContainerWidth,
                    alignSelf: 'center', // centers horizontally
                }}
                showsVerticalScrollIndicator
            >
                <Pressable
                    onPress={handleImagePress}
                    ref={imageWrapperRef}
                    onLayout={handleLayout}
                    style={{
                        width: zoomedSize.width,
                        height: zoomedSize.height,
                        marginLeft: zoomedOffsetX,
                        marginTop: zoomedOffsetY,
                        cursor: 'zoom-out',
                    }}
                >
                    <NexusImage
                        source={uri}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="contain"
                        width={zoomedSize.width}
                        height={zoomedSize.height}
                        alt="Computer image preview zoomed"
                    />
                </Pressable>
            </ScrollView>
        </View>
    );
};
