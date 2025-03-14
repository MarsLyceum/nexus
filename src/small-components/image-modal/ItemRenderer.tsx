import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useImageResolution, fitContainer } from 'react-native-zoom-toolkit';

import { NexusVideo } from '../NexusVideo';
import { MobileImageRenderer } from './MobileImageRenderer';
import { ComputerImageRenderer } from './ComputerImageRenderer';

export type ItemRendererProps = {
    item: string;
    mediaInfo: { type: string } | undefined;
    containerWidth: number;
    containerHeight: number;
    isComputer: boolean;
    onClose: () => void;
};

export const ItemRenderer: React.FC<ItemRendererProps> = ({
    item,
    mediaInfo,
    containerWidth,
    containerHeight,
    isComputer,
    onClose,
}) => {
    // Always call hooks in the same order.
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const imageResData = useImageResolution({ uri: item });
    // Fallback resolution.
    const resolution = imageResData.resolution ?? { width: 0, height: 0 };

    // Compute aspect ratio (fallback to 1 if unavailable)
    const aspectRatio =
        resolution.width && resolution.height
            ? resolution.width / resolution.height
            : 1;
    const size = useMemo(
        () =>
            fitContainer(aspectRatio, {
                width: screenWidth,
                height: screenHeight,
            }),
        [aspectRatio, screenWidth, screenHeight]
    );

    // Render based on media type.
    if (mediaInfo && mediaInfo.type === 'video') {
        return (
            <View style={{ width: '100%', height: '100%' }}>
                <NexusVideo
                    source={{ uri: item }}
                    style={{ width: '100%', height: '100%' }}
                    muted={false}
                    repeat
                    paused
                    contentFit="contain"
                    controls
                />
            </View>
        );
    } else if (isComputer) {
        return (
            <View style={{ width: '100%', height: '100%' }}>
                <ComputerImageRenderer
                    uri={item}
                    containerWidth={containerWidth}
                    containerHeight={containerHeight}
                    onClose={onClose}
                />
            </View>
        );
    } else {
        return (
            <View style={{ width: '100%', height: '100%' }}>
                <MobileImageRenderer uri={item} onClose={onClose} />
            </View>
        );
    }
};
