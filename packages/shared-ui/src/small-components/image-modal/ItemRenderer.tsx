import React from 'react';
import { View } from 'react-native';

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
    }
    if (isComputer) {
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
    }
    return (
        <View style={{ width: '100%', height: '100%' }}>
            <MobileImageRenderer uri={item} onClose={onClose} />
        </View>
    );
};
