import { useState, useEffect } from 'react';
import { Image as RNImage, Platform } from 'react-native';
import { createVideoPlayer } from 'expo-video';

export type MediaType = 'video' | 'image';

export type MediaInfo = {
    type: MediaType;
    width: number;
    height: number;
    aspectRatio: number;
};

export const useMediaTypes = (urls: string[]): { [url: string]: MediaInfo } => {
    const [mediaInfo, setMediaInfo] = useState<{ [url: string]: MediaInfo }>(
        {}
    );

    useEffect(() => {
        urls.forEach((url) => {
            // Only process URLs that haven't been handled yet.
            if (!mediaInfo[url]) {
                // Fetch HEAD to determine the content type.
                fetch(url, { method: 'HEAD' })
                    .then((response) => {
                        const contentType =
                            response.headers.get('content-type') || '';
                        const type: MediaType = contentType.startsWith('video')
                            ? 'video'
                            : 'image';

                        if (type === 'image') {
                            // For images, use RNImage.getSize.
                            RNImage.getSize(
                                url,
                                (width, height) =>
                                    setMediaInfo((prev) => ({
                                        ...prev,
                                        [url]: {
                                            type,
                                            width,
                                            height,
                                            aspectRatio: width / height,
                                        },
                                    })),
                                (error) => {
                                    console.error(
                                        'Failed to get image dimensions for',
                                        url,
                                        error
                                    );
                                    const defaultWidth = 300;
                                    setMediaInfo((prev) => ({
                                        ...prev,
                                        [url]: {
                                            type,
                                            width: defaultWidth,
                                            height: defaultWidth,
                                            aspectRatio: 1,
                                        },
                                    }));
                                }
                            );
                        } else {
                            // For videos:
                            if (Platform.OS === 'web') {
                                // Use an HTMLVideoElement on web.
                                const video = document.createElement('video');
                                video.src = url;
                                video.addEventListener('loadedmetadata', () => {
                                    const width = video.videoWidth;
                                    const height = video.videoHeight;
                                    if (width && height) {
                                        setMediaInfo((prev) => ({
                                            ...prev,
                                            [url]: {
                                                type,
                                                width,
                                                height,
                                                aspectRatio: width / height,
                                            },
                                        }));
                                    } else {
                                        // Fallback if dimensions are zero.
                                        const defaultWidth = 300;
                                        const defaultAspect = 16 / 9;
                                        setMediaInfo((prev) => ({
                                            ...prev,
                                            [url]: {
                                                type,
                                                width: defaultWidth,
                                                height:
                                                    defaultWidth /
                                                    defaultAspect,
                                                aspectRatio: defaultAspect,
                                            },
                                        }));
                                    }
                                });
                                video.addEventListener('error', (error) => {
                                    console.error(
                                        'Error loading video metadata for',
                                        url,
                                        error
                                    );
                                    const defaultWidth = 300;
                                    const defaultAspect = 16 / 9;
                                    setMediaInfo((prev) => ({
                                        ...prev,
                                        [url]: {
                                            type,
                                            width: defaultWidth,
                                            height:
                                                defaultWidth / defaultAspect,
                                            aspectRatio: defaultAspect,
                                        },
                                    }));
                                });
                            } else {
                                // For native, use expo-video's generateThumbnailsAsync.
                                const player = createVideoPlayer(url);
                                player
                                    .generateThumbnailsAsync([0])
                                    .then((thumbnails) => {
                                        if (
                                            thumbnails &&
                                            thumbnails.length > 0
                                        ) {
                                            const thumbnail = thumbnails[0];
                                            const { width, height } = thumbnail;
                                            if (width && height) {
                                                setMediaInfo((prev) => ({
                                                    ...prev,
                                                    [url]: {
                                                        type,
                                                        width,
                                                        height,
                                                        aspectRatio:
                                                            width / height,
                                                    },
                                                }));
                                            } else {
                                                const defaultWidth = 300;
                                                const defaultAspect = 16 / 9;
                                                setMediaInfo((prev) => ({
                                                    ...prev,
                                                    [url]: {
                                                        type,
                                                        width: defaultWidth,
                                                        height:
                                                            defaultWidth /
                                                            defaultAspect,
                                                        aspectRatio:
                                                            defaultAspect,
                                                    },
                                                }));
                                            }
                                        } else {
                                            const defaultWidth = 300;
                                            const defaultAspect = 16 / 9;
                                            setMediaInfo((prev) => ({
                                                ...prev,
                                                [url]: {
                                                    type,
                                                    width: defaultWidth,
                                                    height:
                                                        defaultWidth /
                                                        defaultAspect,
                                                    aspectRatio: defaultAspect,
                                                },
                                            }));
                                        }
                                        // Optionally, release the player: player.release();
                                    })
                                    .catch((error) => {
                                        console.error(
                                            'Failed to generate thumbnail for video',
                                            url,
                                            error
                                        );
                                        const defaultWidth = 300;
                                        const defaultAspect = 16 / 9;
                                        setMediaInfo((prev) => ({
                                            ...prev,
                                            [url]: {
                                                type,
                                                width: defaultWidth,
                                                height:
                                                    defaultWidth /
                                                    defaultAspect,
                                                aspectRatio: defaultAspect,
                                            },
                                        }));
                                    });
                            }
                        }
                    })
                    .catch((error) => {
                        console.error('Failed to fetch HEAD for', url, error);
                        setMediaInfo((prev) => ({
                            ...prev,
                            [url]: {
                                type: 'image',
                                width: 300,
                                height: 300,
                                aspectRatio: 1,
                            },
                        }));
                    });
            }
        });
    }, [urls, mediaInfo]);

    return mediaInfo;
};
