import React from 'react';
import { Platform, View } from 'react-native';
import { FlashList, FlashListProps } from '@shopify/flash-list';
import { List as VirtualizedList, AutoSizer } from 'react-virtualized';

export type NexusListProps<T> = FlashListProps<T>;

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
        const rowHeight = estimatedItemSize || 80;
        const overscanRowCount = 3;

        return (
            <AutoSizer>
                {({ height, width }) => (
                    <VirtualizedList
                        width={width}
                        height={height}
                        rowCount={displayedData.length}
                        rowHeight={rowHeight}
                        overscanRowCount={overscanRowCount}
                        // Scroll to the appropriate index based on inversion.
                        scrollToIndex={inverted ? 0 : displayedData.length - 1}
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
                        rowRenderer={({ index, key, style }) => {
                            const item = displayedData[index];
                            return (
                                // Cast the style to satisfy React Native's style type.
                                <View key={key} style={style as any}>
                                    {renderItem!({
                                        item,
                                        index,
                                        target: {} as any,
                                    })}
                                </View>
                            );
                        }}
                    />
                )}
            </AutoSizer>
        );
    } else {
        // On mobile, simply pass all props to FlashList.
        return <FlashList {...props} />;
    }
};
