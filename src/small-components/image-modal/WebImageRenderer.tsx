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

export type WebImageRendererProps = {
    uri: string;
    containerWidth: number;
    containerHeight: number;
    onClose: () => void;
};

export const WebImageRenderer: React.FC<WebImageRendererProps> = ({
    uri,
    containerWidth,
    containerHeight,
    onClose,
}) => {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const [zoomed, setZoomed] = useState(false);

    // Get image resolution and compute aspect ratio.
    const { isFetching, resolution } = useImageResolution({ uri });
    const aspectRatio = useMemo(() => {
        return resolution && resolution.width && resolution.height
            ? resolution.width / resolution.height
            : 1;
    }, [resolution]);

    // Compute non-zoomed visible image size (using container dimensions).
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
    // Compute the visible image size in zoomed state.
    const zoomedSize = useMemo(
        () =>
            fitContainer(aspectRatio, {
                width: zoomedContainerWidth,
                height: zoomedContainerHeight,
            }),
        [aspectRatio, zoomedContainerWidth, zoomedContainerHeight]
    );

    // We'll measure the visible image container using onLayout.
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

    // Attach a document-level mousedown listener that dismisses if click is outside visibleRect.
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

    // Handler for toggling zoom when clicking on the image.
    const handleImagePress = useCallback((e: any) => {
        e.stopPropagation();
        setZoomed((prev) => !prev);
    }, []);

    if (!zoomed) {
        // Non-zoomed state: use outer container centering.
        return (
            <Pressable
                style={{
                    flex: 1,
                    cursor: 'zoom-in',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
                onPress={() => setZoomed(true)}
            >
                <View
                    ref={imageWrapperRef}
                    onLayout={handleLayout}
                    style={{
                        width: nonZoomedSize.width,
                        height: nonZoomedSize.height,
                    }}
                >
                    <ExpoImage
                        source={{ uri }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="contain"
                    />
                </View>
            </Pressable>
        );
    } else {
        // Zoomed state: render the image inside a ScrollView.
        return (
            <View style={{ flex: 1, cursor: 'zoom-out' }}>
                <ScrollView
                    style={{ flex: 1, cursor: 'zoom-out' }}
                    contentContainerStyle={{
                        width: zoomedContainerWidth,
                        // Let the content's natural height be used for vertical scrolling.
                        alignSelf: 'center', // centers horizontally
                    }}
                    showsVerticalScrollIndicator={true}
                >
                    <Pressable
                        ref={imageWrapperRef}
                        onLayout={handleLayout}
                        onPress={handleImagePress}
                        style={{
                            width: zoomedSize.width,
                            height: zoomedSize.height,
                            alignSelf: 'center', // center horizontally
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
