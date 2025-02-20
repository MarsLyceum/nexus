// components/LinkPreview.tsx

import React from 'react';
import { Text } from 'react-native';
import { useLinkPreview } from '../hooks/useLinkPreview';
import { ImagePreview } from './ImagePreview';
import { EmbedPreview } from './EmbedPreview';
import { FallbackPreview } from './FallbackPreview';
import { COLORS } from '../constants';

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
        return <Text style={{ color: COLORS.White }}>Loading preview...</Text>;
    }

    if (isImage) {
        return (
            <ImagePreview
                url={url}
                containerWidth={containerWidth}
                imageDimensions={imageDimensions}
            />
        );
    }

    if (previewData.embedHtml) {
        return (
            <EmbedPreview
                url={url}
                previewData={previewData}
                containerWidth={containerWidth}
            />
        );
    }

    return <FallbackPreview url={url} previewData={previewData} />;
};
