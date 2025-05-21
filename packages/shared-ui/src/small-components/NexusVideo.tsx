// apps/mobile/src/components/NexusVideo.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
    Platform,
    View,
    StyleProp,
    ViewStyle,
    StyleSheet,
    StatusBar,
} from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import Video, {
    OnLoadData,
    OnProgressData,
    VideoRef,
    ViewType,
} from 'react-native-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeGesture } from 'react-native-gesture-handler';

import { MediaPlayerControls } from './MediaPlayerControls';

import { Portal } from '../providers';

type VideoProps = React.ComponentProps<typeof Video>;
type RNVideoResizeMode = VideoProps['resizeMode'];

export type NexusVideoProps = {
    source: { uri: string };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    style?: any;
    muted?: boolean;
    repeat?: boolean;
    paused?: boolean;
    contentFit?: 'contain' | 'cover' | 'fill';
    controls?: boolean;
    sliderGesture?: NativeGesture;
};

export const NexusVideo: React.FC<NexusVideoProps> = ({
    source,
    style,
    muted = true,
    repeat = true,
    paused = true,
    contentFit = 'cover',
    sliderGesture,
    controls = true,
}) => {
    const isWeb = Platform.OS === 'web';
    const webRef = useRef<HTMLVideoElement>(null);
    const wrapperRef = useRef<HTMLElement>(null);
    const insets = useSafeAreaInsets();

    // internal playback state
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [playing, setPlaying] = useState(!paused);
    const [volumeMuted, setVolumeMuted] = useState(muted);
    const [volume, setVolume] = useState(1);
    const [position, setPosition] = useState(0); // ms
    const [totalDuration, setTotalDuration] = useState(0); // ms
    const nativeVideoRef = useRef<VideoRef>(null);
    const [showControls, setShowControls] = useState(true);
    const hideControlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(
        null
    );

    const resetControlsTimer = useCallback(() => {
        setShowControls(true);
        if (hideControlsTimeout.current) {
            clearTimeout(hideControlsTimeout.current);
        }
        hideControlsTimeout.current = setTimeout(() => {
            setShowControls(false);
        }, 3000);
    }, []);

    useEffect(() => {
        if (isFullscreen && playing) {
            resetControlsTimer(); // only kick off when playing in full-screen
        } else {
            if (hideControlsTimeout.current) {
                clearTimeout(hideControlsTimeout.current);
            }
            setShowControls(true); // always show controls if paused or not FS
        }

        return () => {
            if (hideControlsTimeout.current) {
                clearTimeout(hideControlsTimeout.current);
            }
        };
    }, [isFullscreen, playing, resetControlsTimer]);

    // Handlers for MediaPlayerControls
    const togglePlay = useCallback(() => {
        setPlaying((p) => !p);
    }, []);

    const toggleVolumeMuted = useCallback(() => {
        setVolumeMuted((m) => !m);
    }, []);

    const onSeekStart = useCallback(() => {
        // optionally pause while dragging
        setPlaying(false);
    }, []);

    const onSeek = useCallback((ms: number) => {
        setPosition(ms);
    }, []);

    const handleToggleFullScreen = useCallback(async () => {
        if (isWeb) {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            } else {
                wrapperRef.current?.requestFullscreen().catch(() => {});
            }
        } else {
            if (!isFullscreen) {
                // entering full-screen → lock to landscape
                await ScreenOrientation.lockAsync(
                    ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT
                );
                StatusBar.setHidden(true, 'fade');
            } else {
                // exiting full-screen → unlock back to default (both portrait & landscape)
                await ScreenOrientation.lockAsync(
                    ScreenOrientation.OrientationLock.DEFAULT
                );
                StatusBar.setHidden(false, 'fade');
            }

            setIsFullscreen((f) => !f);
        }
    }, [isWeb, isFullscreen]);

    useEffect(() => {
        if (!isWeb) return;
        const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFsChange);
        // eslint-disable-next-line consistent-return
        return () =>
            document.removeEventListener('fullscreenchange', onFsChange);
    }, [isWeb]);

    const onSeekComplete = useCallback(
        (ms: number) => {
            setPosition(ms);
            if (isWeb && webRef) {
                const v = webRef.current!;
                v.currentTime = ms / 1000;
                if (playing) void v.play();
            }
            if (!isWeb && nativeVideoRef.current) {
                nativeVideoRef.current.seek(ms / 1000);
            }
        },
        [playing, isWeb]
    );

    // Sync props → <video> attributes
    useEffect(() => {
        if (isWeb) {
            const v = webRef.current!;
            v.src = source.uri;
            v.loop = repeat;
            setPlaying(!paused);
            if (paused) v.pause();
            else void v.play();
        }
    }, [source.uri, repeat, paused, isWeb]);

    useEffect(() => {
        if (!isWeb) return;
        webRef.current!.muted = volumeMuted;
    }, [volumeMuted, isWeb]);

    useEffect(() => {
        if (isWeb && webRef.current) {
            webRef.current.volume = volume;
        }
    }, [volume, isWeb]);

    // update position & duration from native events
    // eslint-disable-next-line consistent-return
    useEffect(() => {
        if (isWeb) {
            const v = webRef.current!;
            const onTimeUpdate = () => setPosition(v.currentTime * 1000);
            const onLoadedMeta = () => setTotalDuration(v.duration * 1000);
            v.addEventListener('timeupdate', onTimeUpdate);
            v.addEventListener('loadedmetadata', onLoadedMeta);
            v.addEventListener('ended', () => {
                setPlaying(false);
                if (!repeat) v.pause();
            });
            return () => {
                v.removeEventListener('timeupdate', onTimeUpdate);
                v.removeEventListener('loadedmetadata', onLoadedMeta);
            };
        }
    }, [repeat, isWeb]);

    useEffect(() => {
        if (isWeb) {
            const v = webRef.current!;
            if (playing) {
                v.play().catch(() => {}); // imperatively resume
            } else {
                v.pause(); // imperatively pause
            }
        }
    }, [playing, isWeb]);

    useEffect(() => {
        if (isWeb && webRef.current) {
            webRef.current.muted = volumeMuted;
        }
    }, [volumeMuted, isWeb]);

    if (isWeb) {
        const objectFit = contentFit;

        return (
            <View
                onMouseMove={() => {
                    if (isFullscreen && playing) resetControlsTimer();
                }}
                onClick={() => {
                    if (isFullscreen && playing) resetControlsTimer();
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ref={wrapperRef as any}
                style={[
                    style as StyleProp<ViewStyle>,
                    // @ts-expect-error cursor
                    {
                        position: isFullscreen ? 'fixed' : 'relative',
                        top: 0,
                        left: 0,
                        width: isFullscreen ? '100%' : undefined,
                        height: isFullscreen ? '100%' : undefined,
                        backgroundColor: isFullscreen ? 'black' : undefined,
                        overflow: 'hidden',
                        cursor: showControls ? 'auto' : 'none',
                    },
                ]}
            >
                <video
                    ref={webRef}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit,
                    }}
                    controls={false}
                />
                {showControls && controls && (
                    <View
                        style={{
                            position: 'absolute',
                            bottom: 8,
                            left: 0,
                            right: 0,
                            alignItems: 'center',
                            paddingHorizontal: 16,
                            height: 20,
                        }}
                    >
                        <MediaPlayerControls
                            playing={playing}
                            volumeMuted={volumeMuted}
                            volumeLevel={volume}
                            position={position}
                            totalDuration={totalDuration}
                            onTogglePlay={togglePlay}
                            onToggleVolumeMuted={toggleVolumeMuted}
                            onVolumeChange={setVolume}
                            onSlidingStart={onSeekStart}
                            onValueChange={onSeek}
                            onSlidingComplete={onSeekComplete}
                            sliderGesture={sliderGesture}
                            onToggleFullScreen={handleToggleFullScreen}
                        />
                    </View>
                )}
            </View>
        );
    }

    // native
    const resizeMode: RNVideoResizeMode =
        contentFit === 'fill' ? 'stretch' : (contentFit as RNVideoResizeMode);

    const onLoad = (data: OnLoadData) => {
        setTotalDuration(data.duration * 1000);
    };
    const onProgress = (data: OnProgressData) => {
        setPosition(data.currentTime * 1000);
    };
    const onEnd = () => {
        setPlaying(false);
    };

    if (isFullscreen && !isWeb) {
        return (
            <Portal onRequestClose={handleToggleFullScreen}>
                <View
                    style={[
                        StyleSheet.absoluteFillObject,
                        {
                            flex: 1,
                            backgroundColor: 'black',
                        },
                    ]}
                    onStartShouldSetResponder={() => true}
                    onResponderGrant={resetControlsTimer}
                >
                    <Video
                        ref={nativeVideoRef}
                        source={source}
                        style={StyleSheet.absoluteFill}
                        volume={volume}
                        muted={volumeMuted}
                        repeat={repeat}
                        paused={!playing}
                        resizeMode={
                            contentFit === 'fill'
                                ? 'stretch'
                                : (contentFit as any)
                        }
                        onLoad={({ duration }) =>
                            setTotalDuration(duration * 1000)
                        }
                        onProgress={({ currentTime }) =>
                            setPosition(currentTime * 1000)
                        }
                        onEnd={() => setPlaying(false)}
                    />
                    {showControls ? (
                        <View
                            style={[
                                StyleSheet.absoluteFill,
                                {
                                    justifyContent: 'flex-end',
                                    alignItems: 'center',
                                    paddingBottom: insets.bottom + 8,
                                },
                            ]}
                        >
                            <MediaPlayerControls
                                playing={playing}
                                volumeMuted={volumeMuted}
                                volumeLevel={volume}
                                position={position}
                                totalDuration={totalDuration}
                                onTogglePlay={togglePlay}
                                onToggleVolumeMuted={toggleVolumeMuted}
                                onVolumeChange={setVolume}
                                onSlidingStart={onSeekStart}
                                onValueChange={onSeek}
                                onSlidingComplete={onSeekComplete}
                                onToggleFullScreen={handleToggleFullScreen}
                                sliderGesture={sliderGesture}
                            />
                        </View>
                    ) : undefined}
                </View>
            </Portal>
        );
    }

    return (
        <View style={[style as StyleProp<ViewStyle>, { position: 'relative' }]}>
            <View
                style={[
                    style as StyleProp<ViewStyle>,
                    {
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: 8,
                    },
                ]}
            >
                <Video
                    viewType={ViewType.TEXTURE}
                    source={source}
                    style={{ width: '100%', height: '100%', zIndex: 0 }}
                    volume={volume}
                    muted={volumeMuted}
                    repeat={repeat}
                    paused={!playing}
                    resizeMode={resizeMode}
                    controls={false}
                    onLoad={onLoad}
                    onProgress={onProgress}
                    onEnd={onEnd}
                    ref={nativeVideoRef}
                />
            </View>

            {controls && (
                <View
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            paddingBottom: insets.bottom + 8,
                            paddingHorizontal: 16,
                            zIndex: 999,
                            elevation: 10,
                        },
                    ]}
                    renderToHardwareTextureAndroid
                    needsOffscreenAlphaCompositing
                >
                    <MediaPlayerControls
                        playing={playing}
                        volumeMuted={volumeMuted}
                        volumeLevel={volume}
                        position={position}
                        totalDuration={totalDuration}
                        onTogglePlay={togglePlay}
                        onToggleVolumeMuted={toggleVolumeMuted}
                        onVolumeChange={setVolume}
                        onSlidingStart={onSeekStart}
                        onValueChange={onSeek}
                        onSlidingComplete={onSeekComplete}
                        onToggleFullScreen={handleToggleFullScreen}
                    />
                </View>
            )}
        </View>
    );
};
