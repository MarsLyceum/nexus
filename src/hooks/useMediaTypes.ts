// useMediaTypes.ts
import { useState, useEffect } from 'react';

export type MediaType = 'video' | 'image';

export const useMediaTypes = (urls: string[]): { [url: string]: MediaType } => {
    const [mediaTypes, setMediaTypes] = useState<{ [url: string]: MediaType }>(
        {}
    );

    useEffect(() => {
        urls.forEach((url) => {
            // Only fetch if we haven't determined the media type yet.
            if (!mediaTypes[url]) {
                fetch(url, { method: 'HEAD' })
                    .then((response) => {
                        const contentType =
                            response.headers.get('content-type') || '';
                        const type: MediaType = contentType.startsWith('video')
                            ? 'video'
                            : 'image';
                        setMediaTypes((prev) => ({ ...prev, [url]: type }));
                    })
                    .catch((error) => {
                        console.error('Failed to fetch HEAD for', url, error);
                        // On error, default to image.
                        setMediaTypes((prev) => ({ ...prev, [url]: 'image' }));
                    });
            }
        });
    }, [urls, mediaTypes]);

    return mediaTypes;
};
