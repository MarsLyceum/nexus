// FlashListCompat.tsx
import React, { useState, useRef, useCallback } from 'react';
import {
    ScrollView,
    View,
    StyleSheet,
    LayoutChangeEvent,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import throttle from 'lodash/throttle';

export type FlashListProps<T> = {
    /** Array of items to render */
    data: T[];
    /** Function that renders each item given its data and index */
    renderItem: ({
        item,
        index,
    }: {
        item: T;
        index: number;
    }) => React.ReactElement;
    /** Estimated size (in pixels) for each item (used until measured) */
    estimatedItemSize: number;
    /** If true, the list is inverted (i.e. new items appear at the bottom) */
    inverted?: boolean;
    /** Called when the list has been scrolled to within onEndReachedThreshold of the end (or start if inverted) */
    onEndReached?: () => void;
    /**
     * How close (in pixels or as a fraction of container height if < 1) to the bottom (or top if inverted)
     * before triggering onEndReached.
     */
    onEndReachedThreshold?: number;
    /** Function to extract a unique key for each item */
    keyExtractor?: (item: T, index: number) => string;
    /** Optional header component */
    ListHeaderComponent?: React.ReactElement | null;
    /** Optional footer component */
    ListFooterComponent?: React.ReactElement | null;
};

export function FlashListCompat<T>(props: FlashListProps<T>) {
    const {
        data,
        renderItem,
        estimatedItemSize,
        inverted = false,
        onEndReached,
        onEndReachedThreshold = 100,
        keyExtractor,
        ListHeaderComponent,
        ListFooterComponent,
    } = props;

    // measuredHeights stores actual measured height for each item.
    const measuredHeights = useRef<Map<number, number>>(new Map());
    // containerHeight holds the visible viewport height.
    const [containerHeight, setContainerHeight] = useState(0);
    // scrollOffset is updated by our throttled scroll event.
    const [scrollOffset, setScrollOffset] = useState(0);

    // Throttled scroll handler: update scroll offset and check if we need to trigger onEndReached.
    const onScroll = throttle(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const offset = event.nativeEvent.contentOffset.y;
            setScrollOffset(offset);

            // Compute total content height.
            const totalHeight = data.reduce((sum, _, index) => {
                return (
                    sum +
                    (measuredHeights.current.get(index) || estimatedItemSize)
                );
            }, 0);

            // Check infinite scroll condition.
            if (onEndReached) {
                // If threshold is less than 1, treat it as a fraction of containerHeight.
                const threshold =
                    onEndReachedThreshold < 1
                        ? containerHeight * onEndReachedThreshold
                        : onEndReachedThreshold;
                if (
                    !inverted &&
                    offset + containerHeight + threshold >= totalHeight
                ) {
                    onEndReached();
                } else if (inverted && offset <= threshold) {
                    onEndReached();
                }
            }
        },
        50
    );

    // onLayout for the outer container to measure its height.
    const onContainerLayout = (event: LayoutChangeEvent) => {
        const { height } = event.nativeEvent.layout;
        if (height > 0 && height !== containerHeight) {
            setContainerHeight(height);
        }
    };

    // Compute cumulative offsets for each item.
    const offsets = new Array(data.length);
    let totalContentHeight = 0;
    for (let i = 0; i < data.length; i++) {
        offsets[i] = totalContentHeight;
        const h = measuredHeights.current.get(i) || estimatedItemSize;
        totalContentHeight += h;
    }

    // Determine visible indices based on scrollOffset and containerHeight.
    const getVisibleIndices = (): { start: number; end: number } => {
        let start = 0;
        let end = data.length - 1;
        // Find first visible item.
        for (let i = 0; i < data.length; i++) {
            const itemTop = offsets[i];
            const itemBottom =
                itemTop + (measuredHeights.current.get(i) || estimatedItemSize);
            if (itemBottom >= scrollOffset) {
                start = Math.max(0, i - 2); // add buffer before
                break;
            }
        }
        // Find last visible item.
        for (let i = start; i < data.length; i++) {
            const itemTop = offsets[i];
            if (itemTop > scrollOffset + containerHeight) {
                end = Math.min(data.length - 1, i + 2); // add buffer after
                break;
            }
        }
        return { start, end };
    };

    const { start, end } = getVisibleIndices();
    const visibleIndices = [];
    for (let i = start; i <= end; i++) {
        visibleIndices.push(i);
    }

    // Each rendered item is measured on layout.
    const onItemLayout = (index: number) => (event: LayoutChangeEvent) => {
        const height = event.nativeEvent.layout.height;
        if (measuredHeights.current.get(index) !== height) {
            measuredHeights.current.set(index, height);
            // Force a re-render by updating scrollOffset with the same value.
            setScrollOffset((s) => s);
        }
    };

    // Default key extractor.
    const extractKey = (item: T, index: number) =>
        keyExtractor ? keyExtractor(item, index) : index.toString();

    // Render visible items.
    const renderedItems = visibleIndices.map((index) => {
        const item = data[index];
        const itemHeight =
            measuredHeights.current.get(index) || estimatedItemSize;
        // Compute top position; if inverted, position from bottom.
        const top = inverted
            ? totalContentHeight - offsets[index] - itemHeight
            : offsets[index];
        return (
            <View
                key={extractKey(item, index)}
                onLayout={onItemLayout(index)}
                style={[
                    styles.itemContainer,
                    { position: 'absolute', top, left: 0, right: 0 },
                ]}
            >
                {renderItem({ item, index })}
            </View>
        );
    });

    return (
        <View style={styles.container} onLayout={onContainerLayout}>
            {ListHeaderComponent}
            <ScrollView
                onScroll={onScroll}
                scrollEventThrottle={16}
                style={styles.scrollView}
            >
                <View
                    style={{ height: totalContentHeight, position: 'relative' }}
                >
                    {renderedItems}
                </View>
                {ListFooterComponent}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    itemContainer: {
        // Customize item styling as needed.
    },
});
