import React, {
    useMemo,
    useRef,
    useEffect,
    forwardRef,
    useImperativeHandle,
} from 'react';
import { Platform, View } from 'react-native';
import { FlashList, FlashListProps } from '@shopify/flash-list';
import {
    List as VirtualizedList,
    AutoSizer,
    CellMeasurer,
    CellMeasurerCache,
} from 'react-virtualized';

export type NexusListProps<T> = FlashListProps<T>;

/**
 * MeasuredView is a wrapper that attaches load event listeners to any <img> or <video> elements
 * within its rendered content. When an image or video loads, it triggers a re-measure via the provided measure callback.
 * This is implemented using forwardRef so that CellMeasurer can register the underlying DOM element.
 */
const MeasuredView = forwardRef<
    HTMLDivElement,
    { measure: () => void; style: any; children: React.ReactNode }
>((props, ref) => {
    const { measure, style, children, ...rest } = props;
    const innerRef = useRef<HTMLDivElement | null>(null);

    // Expose the inner ref to the parent (CellMeasurer)
    useImperativeHandle(ref, () => innerRef.current as HTMLDivElement);

    useEffect(() => {
        const node = innerRef.current;
        if (node) {
            // Find all images and videos within this node.
            const images = [...node.querySelectorAll('img')];
            const videos = [...node.querySelectorAll('video')];
            // Attach load event listener to images.
            images.forEach((img) => {
                img.addEventListener('load', measure);
            });
            // Attach event listeners to videos.
            videos.forEach((video) => {
                video.addEventListener('loadedmetadata', measure);
                video.addEventListener('loadeddata', measure);
            });
            // Cleanup listeners on unmount or when dependencies change.
            return () => {
                images.forEach((img) => {
                    img.removeEventListener('load', measure);
                });
                videos.forEach((video) => {
                    video.removeEventListener('loadedmetadata', measure);
                    video.removeEventListener('loadeddata', measure);
                });
            };
        }
    }, [measure, children]);

    return (
        <View ref={innerRef} style={style} {...rest}>
            {children}
        </View>
    );
});

export const NexusList = <T extends unknown>(
    props: NexusListProps<T>
): JSX.Element => {
    // Extract properties and ensure data is defined
    const {
        data,
        inverted = false,
        renderItem,
        estimatedItemSize,
        onScroll,
    } = props;
    const safeData = data ?? [];

    if (Platform.OS === 'web') {
        // Reverse the data if inverted is true.
        const displayedData = inverted ? [...safeData].reverse() : safeData;
        // Use the estimated item size as the default height.
        const defaultHeight = estimatedItemSize || 80;
        const overscanRowCount = 3;
        const bottomPadding = 20; // Extra padding at the bottom of the list

        // Memoize cache to persist measurements between renders.
        const cache = useMemo(
            () =>
                new CellMeasurerCache({
                    defaultHeight,
                    fixedWidth: true,
                }),
            [defaultHeight]
        );

        return (
            <AutoSizer>
                {({ height, width }) => (
                    // Wrap the list in a container with bottom padding.
                    <div
                        style={{ height, width, paddingBottom: bottomPadding }}
                    >
                        <VirtualizedList
                            width={width}
                            height={height - bottomPadding}
                            rowCount={displayedData.length}
                            // Use the deferredMeasurementCache for dynamic row heights.
                            deferredMeasurementCache={cache}
                            rowHeight={cache.rowHeight}
                            overscanRowCount={overscanRowCount}
                            // Scroll to the appropriate index based on inversion.
                            scrollToIndex={
                                inverted ? 0 : displayedData.length - 1
                            }
                            onScroll={
                                onScroll
                                    ? (params) => {
                                          // Map VirtualizedList onScroll params to a fake NativeSyntheticEvent.
                                          const fakeEvent = {
                                              nativeEvent: {
                                                  contentOffset: {
                                                      x: 0,
                                                      y: params.scrollTop,
                                                  },
                                              },
                                          };
                                          onScroll(fakeEvent as any);
                                      }
                                    : undefined
                            }
                            rowRenderer={({ index, key, parent, style }) => {
                                const item = displayedData[index];
                                return (
                                    <CellMeasurer
                                        cache={cache}
                                        columnIndex={0}
                                        key={key}
                                        parent={parent}
                                        rowIndex={index}
                                    >
                                        {({ registerChild, measure }) => (
                                            <MeasuredView
                                                measure={measure}
                                                style={style as any}
                                                ref={registerChild}
                                            >
                                                {renderItem!({
                                                    item,
                                                    index,
                                                    target: {} as any,
                                                })}
                                            </MeasuredView>
                                        )}
                                    </CellMeasurer>
                                );
                            }}
                        />
                    </div>
                )}
            </AutoSizer>
        );
    } 
        // On mobile, simply pass all props to FlashList.
        return <FlashList {...props} />;
    
};
