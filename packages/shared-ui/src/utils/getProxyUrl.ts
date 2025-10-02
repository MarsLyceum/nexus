import { Platform } from 'react-native';

/**
 * Generates a proxy URL for Google Cloud Storage images to avoid CORS issues.
 *
 * For GCS URLs on web platform, routes through the local image proxy endpoint.
 * For non-GCS URLs or native platforms, returns the original URL.
 *
 * @param originalUrl - The original image URL
 * @returns The proxy URL (if needed) or the original URL
 */
export const getProxyUrl = (originalUrl: string): string => {
    const isGcsUrl = originalUrl.startsWith('https://storage.googleapis.com/');

    // Only proxy GCS URLs on web platform
    if (!isGcsUrl || Platform.OS !== 'web') {
        return originalUrl;
    }

    // Use the backend directly (port 4000) - CORS is configured to allow all localhost origins
    return `http://localhost:4000/api/image-proxy?url=${encodeURIComponent(originalUrl)}`;
};
