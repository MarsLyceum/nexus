import React, {
    useState,
    useRef,
    useCallback,
    useEffect,
    useMemo,
} from 'react';
import {
    View,
    ScrollView,
    useWindowDimensions,
    Pressable,
    LayoutChangeEvent,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useImageResolution, fitContainer } from 'react-native-zoom-toolkit';

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
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const [zoomed, setZoomed] = useState(false);

    // Use image resolution to compute the aspect ratio.
    const { isFetching, resolution } = useImageResolution({ uri });
    const aspectRatio = useMemo(() => {
        return resolution && resolution.width && resolution.height
            ? resolution.width / resolution.height
            : 1;
    }, [resolution]);

    // Compute the visible image size in non-zoomed state.
    const nonZoomedSize = useMemo(
        () =>
            fitContainer(aspectRatio, {
                width: containerWidth,
                height: containerHeight,
            }),
        [aspectRatio, containerWidth, containerHeight]
    );
    const nonZoomedOffsetX = (containerWidth - nonZoomedSize.width) / 2;
    const nonZoomedOffsetY = (containerHeight - nonZoomedSize.height) / 2;

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

    // We'll measure the rendered visible image area using onLayout.
    const [visibleRect, setVisibleRect] = useState<{
        left: number;
        top: number;
        right: number;
        bottom: number;
    } | null>(null);
    const imageWrapperRef = useRef<View>(null);

    const handleLayout = useCallback((e: LayoutChangeEvent) => {
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

    // Attach a document-level mousedown listener that dismisses the modal if the click occurs outside the visible image area.
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

    // Handler for toggling zoom when clicking the image.
    const handleImagePress = useCallback((e: any) => {
        e.stopPropagation();
        setZoomed((prev) => !prev);
    }, []);

    if (!zoomed) {
        // Non-zoomed state: render the image in a container that centers it.
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                {/* Only the visible image area has the zoom-in cursor and toggles zoom */}
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
                    <ExpoImage
                        source={{ uri }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="contain"
                    />
                </Pressable>
            </View>
        );
    } else {
        // Zoomed state: render the zoomed image inside a ScrollView so vertical scrolling works.
        return (
            <View style={{ flex: 1, cursor: 'zoom-out' }}>
                <ScrollView
                    style={{ flex: 1, cursor: 'zoom-out' }}
                    contentContainerStyle={{
                        width: zoomedContainerWidth,
                        alignSelf: 'center', // centers horizontally
                    }}
                    showsVerticalScrollIndicator={true}
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
                        <ExpoImage
                            source={{ uri }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="contain"
                        />
                    </Pressable>
                </ScrollView>
            </View>
        );
    }
};
