// hooks/useLinkPreview.ts

import { useState, useEffect } from 'react';
import { Platform, Image as RNImage } from 'react-native';
import {
    isImageUrl,
    getDomainFromUrl,
    getOEmbedEndpoint,
} from '../utils/linkPreviewUtils';

// Define a type for the preview data.
type PreviewData = {
    title?: string;
    description?: string;
    images?: string[];
    siteName?: string;
    url?: string;
    locale?: string;
    ogType?: string;
    logo?: string;
    embedHtml?: string;
};

export function useLinkPreview(url: string) {
    const [previewData, setPreviewData] = useState<PreviewData>({});
    const [loading, setLoading] = useState(true);
    const [isImage, setIsImage] = useState(false);
    const [imageDimensions, setImageDimensions] = useState<
        | {
              width: number;
              height: number;
          }
        | undefined
    >();

    useEffect(() => {
        async function fetchPreview() {
            // Check if the URL is an image.
            const imageResult = await isImageUrl(url);
            if (imageResult) {
                setIsImage(true);
                setPreviewData({
                    title: url,
                    description: '',
                    images: [url],
                    siteName: getDomainFromUrl(url),
                    url,
                });
                // Get image dimensions.
                RNImage.getSize(
                    url,
                    (width, height) => setImageDimensions({ width, height }),
                    (error) => console.error('Failed to get image size', error)
                );
                setLoading(false);
                return;
            }

            // Fetch oEmbed/Open Graph data.
            try {
                const oEmbedEndpoint = getOEmbedEndpoint(url);
                if (oEmbedEndpoint) {
                    try {
                        const response = await fetch(oEmbedEndpoint);
                        if (!response.ok) {
                            throw new Error(
                                `oEmbed request failed with status: ${response.status}`
                            );
                        }
                        const oEmbedData = await response.json();
                        setPreviewData({
                            title: oEmbedData.title || url,
                            description:
                                oEmbedData.author_name ||
                                oEmbedData.description ||
                                '',
                            images: oEmbedData.thumbnail_url
                                ? [oEmbedData.thumbnail_url]
                                : [],
                            siteName: getDomainFromUrl(url),
                            url,
                            locale: oEmbedData.locale || '',
                            ogType: oEmbedData.type || '',
                            logo: '',
                            embedHtml: oEmbedData.html,
                        });
                        setLoading(false);
                        return;
                    } catch (err) {
                        console.warn('oEmbed fetch failed:', err);
                        // Fall through to fallback.
                    }
                }
                // Fallback: Open Graph scraping.
                const fetchUrl =
                    Platform.OS === 'web'
                        ? `https://thingproxy.freeboard.io/fetch/${url}`
                        : url;
                const response = await fetch(fetchUrl);
                const html = await response.text();
                const ogTitleMatch = html.match(
                    /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i
                );
                const ogDescriptionMatch = html.match(
                    /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i
                );
                const ogImageMatch = html.match(
                    /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i
                );
                const titleFallbackMatch = html.match(/<title>(.*?)<\/title>/i);
                setPreviewData({
                    title: ogTitleMatch
                        ? ogTitleMatch[1]
                        : titleFallbackMatch
                          ? titleFallbackMatch[1]
                          : url,
                    description: ogDescriptionMatch
                        ? ogDescriptionMatch[1]
                        : '',
                    images: ogImageMatch ? [ogImageMatch[1]] : [],
                    siteName: getDomainFromUrl(url),
                    url,
                });
            } catch (error) {
                console.error('Manual link preview error:', error);
                setPreviewData({ title: url, description: '' });
            } finally {
                setLoading(false);
            }
        }
        fetchPreview();
    }, [url]);

    return { previewData, loading, isImage, imageDimensions };
}
