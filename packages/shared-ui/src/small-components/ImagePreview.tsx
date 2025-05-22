import React, { useState } from 'react';
import { StyleSheet, Pressable } from 'react-native';

import { MediaDetailsModal } from '../sections/MediaDetailsModal';
import { computeMediaSize } from '../utils';

import { NexusImage } from './NexusImage';

export type ImagePreviewProps = {
    url: string;
    containerWidth?: number;
    imageDimensions?: { width: number; height: number };
};

export const ImagePreview: React.FC<ImagePreviewProps> = ({
    url,
    containerWidth,
    imageDimensions,
}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const computedSize = computeMediaSize(
        imageDimensions ? imageDimensions.width / imageDimensions.height : 1,
        containerWidth
    );

    return (
        <>
            <Pressable
                onPress={() => setModalVisible(true)}
                style={styles.linkPreviewContainer}
            >
                <NexusImage
                    source={url}
                    style={{
                        marginBottom: 5,
                        borderRadius: 8,
                    }}
                    contentFit="contain"
                    width={computedSize.width}
                    height={computedSize.height}
                    alt="Image preview"
                />
            </Pressable>
            <MediaDetailsModal
                visible={modalVisible}
                attachments={[url]}
                initialIndex={0}
                onClose={() => setModalVisible(false)}
            />
        </>
    );
};

const styles = StyleSheet.create({
    linkPreviewContainer: {
        borderWidth: 0,
        borderColor: '#ccc',
        padding: 10,
        marginVertical: 5,
        borderRadius: 8,
    },
});
