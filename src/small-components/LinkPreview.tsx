import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLinkPreview } from '../hooks/useLinkPreview';
import { ImagePreview } from './ImagePreview';
import { EmbedPreview } from './EmbedPreview';
import { RegularWebsitePreview } from './RegularWebsitePreview';
import { LinkPreviewSkeleton } from './LinkPreviewSkeleton';

export type LinkPreviewProps = {
    url: string;
    containerWidth?: number;
};

export const LinkPreview: React.FC<LinkPreviewProps> = ({
    url,
    containerWidth,
}) => {
    const { previewData, loading, isImage, imageDimensions } =
        useLinkPreview(url);

    if (loading) {
        return <LinkPreviewSkeleton containerWidth={containerWidth} />;
    }

    if (isImage) {
        return (
            <View style={styles.container}>
                <ImagePreview
                    url={url}
                    containerWidth={containerWidth}
                    imageDimensions={imageDimensions}
                />
            </View>
        );
    }

    if (previewData.embedHtml) {
        return (
            <View style={styles.container}>
                <EmbedPreview
                    url={url}
                    previewData={previewData}
                    containerWidth={containerWidth}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <RegularWebsitePreview url={url} previewData={previewData} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignSelf: 'flex-start',
        // width is "auto" by default, so this container will only occupy the space it needs.
    },
});
