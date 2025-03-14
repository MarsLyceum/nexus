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
    // We'll store the bounding box (in client coordinates) of the visible image container.
    const [visibleRect, setVisibleRect] = useState<{
        left: number;
        top: number;
        right: number;
        bottom: number;
    } | null>(null);
    // Ref for the inner container that exactly wraps the rendered image.
    const visibleRef = useRef<View>(null);

    // Fixed zoom factor.
    const zoomFactor = 2.5;
    const zoomedContainerWidth = containerWidth * zoomFactor;
    const zoomedContainerHeight = containerHeight * zoomFactor;

    // Use useImageResolution to get the image resolution.
    const { isFetching, resolution } = useImageResolution({ uri });
    // Compute the image's aspect ratio. (Fallback to 1.)
    const aspectRatio =
        resolution && resolution.width && resolution.height
            ? resolution.width / resolution.height
            : 1;
    // Compute the "visible" size of the image when rendered with contentFit="contain"
    // inside a container of size zoomedContainerWidth x zoomedContainerHeight.
    const zoomedVisibleSize = useMemo(
        () =>
            fitContainer(aspectRatio, {
                width: zoomedContainerWidth,
                height: zoomedContainerHeight,
            }),
        [aspectRatio, zoomedContainerWidth, zoomedContainerHeight]
    );
    // Compute offsets inside the zoomed container.
    const zoomedOffsetX = (zoomedContainerWidth - zoomedVisibleSize.width) / 2;
    const zoomedOffsetY =
        (zoomedContainerHeight - zoomedVisibleSize.height) / 2;

    // onLayout handler to measure the visible image container.
    const handleVisibleLayout = useCallback((e: LayoutChangeEvent) => {
        if (visibleRef.current) {
            visibleRef.current.measure((fx, fy, width, height, px, py) => {
                setVisibleRect({
                    left: px,
                    top: py,
                    right: px + width,
                    bottom: py + height,
                });
            });
        }
    }, []);

    // Document-level click listener: if click occurs outside visibleRect, dismiss.
    useEffect(() => {
        if (!zoomed) return;
        const handleDocumentClick = (event: MouseEvent) => {
            if (visibleRect) {
                const { clientX, clientY } = event;
                if (
                    clientX < visibleRect.left ||
                    clientX > visibleRect.right ||
                    clientY < visibleRect.top ||
                    clientY > visibleRect.bottom
                ) {
                    onClose();
                }
            }
        };
        document.addEventListener('mousedown', handleDocumentClick);
        return () => {
            document.removeEventListener('mousedown', handleDocumentClick);
        };
    }, [zoomed, visibleRect, onClose]);

    // Non-zoomed state: clicking on the image toggles zoom in.
    if (!zoomed) {
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
                <ExpoImage
                    source={{ uri }}
                    style={{ width: containerWidth, height: containerHeight }}
                    contentFit="contain"
                />
            </Pressable>
        );
    } else {
        // Zoomed state: render the image inside a ScrollView for vertical scrolling.
        return (
            <View style={{ flex: 1, cursor: 'zoom-out' }}>
                <ScrollView
                    style={{ flex: 1, cursor: 'zoom-out' }}
                    contentContainerStyle={{
                        // The content container has the full zoomed container width.
                        width: zoomedContainerWidth,
                        // Allow the height to be determined by the inner image.
                        alignSelf: 'center', // horizontally center the content container.
                    }}
                    showsVerticalScrollIndicator={true}
                >
                    {/* Render the visible image container with exact dimensions */}
                    <View
                        ref={visibleRef}
                        onLayout={handleVisibleLayout}
                        style={{
                            width: zoomedVisibleSize.width,
                            height: zoomedVisibleSize.height,
                            marginLeft: zoomedOffsetX,
                            marginTop: zoomedOffsetY,
                            // backgroundColor: 'rgba(0,255,0,0.2)', // Uncomment for debugging
                        }}
                    >
                        <Pressable
                            onPress={() => setZoomed(false)}
                            style={{ flex: 1, cursor: 'zoom-out' }}
                        >
                            <ExpoImage
                                source={{ uri }}
                                style={{ width: '100%', height: '100%' }}
                                contentFit="contain"
                            />
                        </Pressable>
                    </View>
                </ScrollView>
            </View>
        );
    }
};
