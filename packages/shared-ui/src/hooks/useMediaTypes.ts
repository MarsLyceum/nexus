import { useState, useEffect, useRef } from 'react';
import { Image as RNImage, Platform } from 'react-native';
import { createVideoPlayer } from 'expo-video';
import { getProxyUrl } from '../utils';

export type MediaType = 'video' | 'image';

export type MediaInfo = {
    type: MediaType;
    width: number;
    height: number;
    aspectRatio: number;
};

export type MediaInfoByUrl = Record<string, MediaInfo>;
export type MediaDimensions = Partial<Pick<MediaInfo, 'width' | 'height'>>;

export const useMediaTypes = (urls: string[]): MediaInfoByUrl => {
    const [mediaInfo, setMediaInfo] = useState<MediaInfoByUrl>({});
    const mediaInfoRef = useRef<MediaInfoByUrl>({});

    const defaultVideoWidth = 300;
    const defaultVideoAspect = 16 / 9;
    const defaultVideoHeight = defaultVideoWidth / defaultVideoAspect;

    const ensureMediaInfo = (
        type: MediaType,
        dimensions: MediaDimensions
    ): MediaInfo => {
        const width = dimensions.width ?? defaultVideoWidth;
        const height = dimensions.height ?? defaultVideoHeight;
        const aspectRatio =
            dimensions.width && dimensions.height
                ? dimensions.width / dimensions.height
                : defaultVideoAspect;

        return { type, width, height, aspectRatio } satisfies MediaInfo;
    };

    const writeInfo = (url: string, info: MediaInfo) =>
        setMediaInfo((current) => {
            if (current[url]) {
                mediaInfoRef.current = current;
                return current;
            }
            const next = {
                ...current,
                [url]: info,
            } satisfies MediaInfoByUrl;
            mediaInfoRef.current = next;
            return next;
        });

    useEffect(() => {
        mediaInfoRef.current = mediaInfo;
    }, [mediaInfo]);

    useEffect(() => {
        let cancelled = false;
        const abortControllers: AbortController[] = [];
        const trackedVideos: Array<{
            video: HTMLVideoElement;
            cleanup: () => void;
        }> = [];

        const safeWrite = (url: string, info: MediaInfo) => {
            if (cancelled) return;
            writeInfo(url, info);
        };

        const safeWriteDimensions = (
            url: string,
            type: MediaType,
            dimensions: MediaDimensions
        ) => safeWrite(url, ensureMediaInfo(type, dimensions));

        const safeFetch = (input: RequestInfo, init?: RequestInit) => {
            const controller = new AbortController();
            abortControllers.push(controller);
            return fetch(input, {
                ...init,
                signal: controller.signal,
            });
        };

        const unhandledUrls = urls.filter(
            (url) => mediaInfoRef.current[url] === undefined
        );

        unhandledUrls.forEach((url) => {
            const originalUri = url;
            const proxyUri = getProxyUrl(originalUri);
            const fallbackUri = `https://images.weserv.nl/?url=${encodeURIComponent(originalUri)}`;

            const handleFetch = (response: Response) => {
                const contentType = response.headers.get('content-type') ?? '';
                const detectedType: MediaType = contentType.startsWith('video')
                    ? 'video'
                    : 'image';

                if (detectedType === 'image') {
                    RNImage.getSize(
                        originalUri,
                        (width, height) =>
                            safeWrite(originalUri, {
                                type: detectedType,
                                width,
                                height,
                                aspectRatio: width / height,
                            }),
                        (error) => {
                            console.error(
                                'Failed to get image dimensions for',
                                originalUri,
                                error
                            );
                            safeWrite(originalUri, {
                                type: detectedType,
                                width: defaultVideoWidth,
                                height: defaultVideoWidth,
                                aspectRatio: 1,
                            });
                        }
                    );
                    return;
                }

                if (Platform.OS === 'web') {
                    const videoElement = document.createElement('video');
                    videoElement.src = originalUri;

                    const handleLoaded = () => {
                        safeWriteDimensions(originalUri, detectedType, {
                            width: videoElement.videoWidth,
                            height: videoElement.videoHeight,
                        });
                        videoElement.removeEventListener(
                            'loadedmetadata',
                            handleLoaded
                        );
                        videoElement.removeEventListener('error', handleError);
                    };

                    const handleError = (event: Event) => {
                        console.error(
                            'Error loading video metadata for',
                            originalUri,
                            event
                        );
                        safeWriteDimensions(originalUri, detectedType, {});
                        videoElement.removeEventListener(
                            'loadedmetadata',
                            handleLoaded
                        );
                        videoElement.removeEventListener('error', handleError);
                    };

                    videoElement.addEventListener(
                        'loadedmetadata',
                        handleLoaded
                    );
                    videoElement.addEventListener('error', handleError);

                    trackedVideos.push({
                        video: videoElement,
                        cleanup: () => {
                            videoElement.removeEventListener(
                                'loadedmetadata',
                                handleLoaded
                            );
                            videoElement.removeEventListener(
                                'error',
                                handleError
                            );
                        },
                    });

                    return;
                }

                const player = createVideoPlayer(originalUri);
                void player
                    .generateThumbnailsAsync([0])
                    .then((thumbnails) => {
                        if (thumbnails?.length) {
                            const [{ width, height }] = thumbnails;
                            safeWriteDimensions(originalUri, detectedType, {
                                width,
                                height,
                            });
                            return;
                        }

                        safeWriteDimensions(originalUri, detectedType, {});
                        throw new Error('Missing thumbnails');
                    })
                    .catch((error) => {
                        console.error(
                            'Failed to generate thumbnail for video',
                            originalUri,
                            error
                        );
                        safeWriteDimensions(originalUri, detectedType, {});
                        return undefined;
                    })
                    .finally(() => {
                        player.release?.();
                    });
            };

            const fetchWithFallbacks = async () => {
                try {
                    handleFetch(await safeFetch(proxyUri, { method: 'HEAD' }));
                    return;
                } catch (headError) {
                    if (
                        headError instanceof Error &&
                        headError.name === 'AbortError'
                    ) {
                        return;
                    }
                    console.error(
                        'Failed to fetch HEAD for',
                        proxyUri,
                        headError
                    );
                }

                try {
                    handleFetch(await safeFetch(proxyUri, { method: 'GET' }));
                    return;
                } catch (getError) {
                    if (
                        getError instanceof Error &&
                        getError.name === 'AbortError'
                    ) {
                        return;
                    }
                    console.error(
                        'Failed to fetch GET for',
                        proxyUri,
                        getError
                    );
                }

                try {
                    handleFetch(
                        await safeFetch(fallbackUri, { method: 'HEAD' })
                    );
                    return;
                } catch (fallbackError) {
                    if (
                        fallbackError instanceof Error &&
                        fallbackError.name === 'AbortError'
                    ) {
                        return;
                    }
                    console.error(
                        'Failed to fetch HEAD for',
                        fallbackUri,
                        fallbackError
                    );
                }

                safeWrite(originalUri, {
                    type: 'image',
                    width: defaultVideoWidth,
                    height: defaultVideoWidth,
                    aspectRatio: 1,
                });
            };

            void fetchWithFallbacks();
        });

        return () => {
            cancelled = true;
            abortControllers.forEach((controller) => {
                controller.abort();
            });
            trackedVideos.forEach(({ cleanup }) => cleanup());
        };
    }, [urls]);

    return mediaInfo;
};
