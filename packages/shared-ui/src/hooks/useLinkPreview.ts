import { useState, useEffect } from 'react';
import { Platform, Image as RNImage } from 'react-native';
import { decode } from 'html-entities';
import {
    isImageUrl,
    getDomainFromUrl,
    getOEmbedEndpoint,
} from '../utils/linkPreviewUtils';
import { PreviewData } from '../types';

type UseLinkPreviewParams = {
    url?: string;
    previewData?: PreviewData;
};

export function useLinkPreview({
    url,
    previewData: initialPreviewData,
}: UseLinkPreviewParams) {
    const [previewData, setPreviewData] = useState<PreviewData>(
        initialPreviewData || {}
    );
    const [loading, setLoading] = useState<boolean>(!initialPreviewData);
    const [isImage, setIsImage] = useState<boolean>(false);
    const [imageDimensions, setImageDimensions] = useState<
        { width: number; height: number } | undefined
    >(undefined);

    useEffect(() => {
        // If preview data was provided, do not fetch anything.
        if (initialPreviewData) {
            setPreviewData(initialPreviewData);
            setLoading(false);
            return;
        }
        if (!url) {
            setLoading(false);
            return;
        }

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
                RNImage.getSize(
                    url,
                    (width, height) => setImageDimensions({ width, height }),
                    (error) => console.error('Failed to get image size', error)
                );
                setLoading(false);
                return;
            }

            // Try oEmbed/Open Graph data.
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
                        const data: PreviewData = {
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
                        };
                        setPreviewData(data);
                        if (data.images && data.images.length > 0) {
                            RNImage.getSize(
                                data.images[0],
                                (width, height) =>
                                    setImageDimensions({ width, height }),
                                (error) =>
                                    console.error(
                                        'Failed to get image size',
                                        error
                                    )
                            );
                        }
                        setLoading(false);
                        return;
                    } catch (error) {
                        console.warn('oEmbed fetch failed:', error);
                    }
                }

                // Reddit JSON Fallback with URL decoding.
                if (url.includes('reddit.com')) {
                    try {
                        const redditUrl = url.endsWith('/')
                            ? `${url}.json`
                            : `${url}/.json`;
                        const redditResponse = await fetch(redditUrl);
                        if (redditResponse.ok) {
                            const redditData = await redditResponse.json();
                            const postData =
                                redditData[0]?.data?.children[0]?.data;
                            if (postData) {
                                let images: string[] = [];
                                if (
                                    postData.preview?.images &&
                                    postData.preview.images.length > 0
                                ) {
                                    const imageSource =
                                        postData.preview.images[0].source;
                                    if (imageSource && imageSource.url) {
                                        const decodedUrl = decode(
                                            imageSource.url
                                        );
                                        images = [decodedUrl];
                                        setImageDimensions({
                                            width: imageSource.width,
                                            height: imageSource.height,
                                        });
                                    }
                                }
                                const redditPreview: PreviewData = {
                                    title: postData.title || url,
                                    description: postData.selftext || '',
                                    images,
                                    siteName: getDomainFromUrl(url),
                                    url,
                                };
                                setPreviewData(redditPreview);
                                if (images.length > 0 && !imageDimensions) {
                                    RNImage.getSize(
                                        images[0],
                                        (width, height) =>
                                            setImageDimensions({
                                                width,
                                                height,
                                            }),
                                        (error) =>
                                            console.error(
                                                'Failed to get image size',
                                                error
                                            )
                                    );
                                }
                                setLoading(false);
                                return;
                            }
                        }
                    } catch (error) {
                        console.warn('Reddit JSON fetch failed:', error);
                    }
                }

                // Fallback: Open Graph scraping from raw HTML.
                let fetchUrl = url;
                if (Platform.OS === 'web') {
                    try {
                        const parsedUrl = new URL(url, window.location.origin);
                        if (
                            parsedUrl.origin !== window.location.origin &&
                            parsedUrl.hostname !== window.location.hostname
                        ) {
                            fetchUrl = `https://thingproxy.freeboard.io/fetch/${url}`;
                        }
                    } catch {
                        fetchUrl = `https://thingproxy.freeboard.io/fetch/${url}`;
                    }
                }
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
                const metaDescriptionMatch = html.match(
                    /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i
                );

                let imgMatch;
                let descriptionFallback;
                if (url.includes('wikipedia.org')) {
                    const contentMatch = html.match(
                        /<div[^>]+id=["']mw-content-text["'][^>]*>([\S\s]*)<\/div>/i
                    );
                    const contentHtml = contentMatch ? contentMatch[1] : html;
                    imgMatch = contentHtml.match(
                        /<img[^>]+src=["']([^"']+)["']/i
                    );
                    const paragraphRegex = /<p\b[^>]*>([\S\s]*?)<\/p>/gi;
                    const paragraphs: string[] = [];
                    let match;
                    while (
                        (match = paragraphRegex.exec(contentHtml)) !== null &&
                        paragraphs.length === 0
                    ) {
                        const paragraphText = decode(
                            match[1].replaceAll(/<[^>]+>/g, '').trim()
                        );
                        if (paragraphText) {
                            paragraphs.push(paragraphText);
                        }
                    }
                    descriptionFallback = paragraphs[0]
                        ? `${paragraphs[0]}...`
                        : '';
                } else {
                    imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
                }
                const firstImageUrl = imgMatch
                    ? new URL(imgMatch[1], url).toString()
                    : undefined;
                const titleFallbackMatch = html.match(/<title>(.*?)<\/title>/i);
                const fallbackPreview: PreviewData = {
                    title: decode(
                        ogTitleMatch
                            ? ogTitleMatch[1]
                            : titleFallbackMatch
                              ? titleFallbackMatch[1]
                              : url
                    ),
                    description: decode(
                        ogDescriptionMatch
                            ? ogDescriptionMatch[1]
                            : metaDescriptionMatch
                              ? metaDescriptionMatch[1]
                              : descriptionFallback || ''
                    ),
                    images: ogImageMatch
                        ? [decode(ogImageMatch[1])]
                        : firstImageUrl
                          ? [decode(firstImageUrl)]
                          : [],
                    siteName: getDomainFromUrl(url),
                    url,
                };

                setPreviewData(fallbackPreview);
                if (
                    fallbackPreview.images &&
                    fallbackPreview.images.length > 0
                ) {
                    RNImage.getSize(
                        fallbackPreview.images[0],
                        (width, height) =>
                            setImageDimensions({ width, height }),
                        (error) =>
                            console.error('Failed to get image size', error)
                    );
                }
            } catch (error) {
                console.error('Manual link preview error:', error);
                setPreviewData({ title: url, description: '' });
            } finally {
                setLoading(false);
            }
        }
        void fetchPreview();
    }, [url, initialPreviewData]);

    return { previewData, loading, isImage, imageDimensions };
}
