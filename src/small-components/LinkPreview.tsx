import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLinkPreview } from '../hooks/useLinkPreview';
import { ImagePreview } from './ImagePreview';
import { EmbedPreview } from './EmbedPreview';
import { RegularWebsitePreview } from './RegularWebsitePreview';
import { LinkPreviewSkeleton } from './LinkPreviewSkeleton';
import { PreviewData } from '../types';

export type LinkPreviewProps = {
    url?: string;
    previewData?: PreviewData;
    containerWidth?: number;
};

export const LinkPreview: React.FC<LinkPreviewProps> = ({
    url,
    previewData: previewDataProp,
    containerWidth,
}) => {
    const { previewData, loading, isImage, imageDimensions } = useLinkPreview({
        url,
        previewData: previewDataProp,
    });

    if (loading) {
        return <LinkPreviewSkeleton containerWidth={containerWidth} />;
    }

    // Use the passed url prop if available, otherwise fallback to previewData.url.
    const effectiveUrl = url || previewData.url || '';

    if (isImage) {
        return (
            <View style={styles.container}>
                <ImagePreview
                    url={effectiveUrl}
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
                    url={effectiveUrl}
                    previewData={previewData}
                    containerWidth={containerWidth}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <RegularWebsitePreview
                url={effectiveUrl}
                previewData={previewData}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignSelf: 'flex-start',
    },
});
