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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeGesture } from 'react-native-gesture-handler';

import { Portal } from '../providers';
import { useIsComputer } from '../hooks';

import { MediaPlayerControls } from './MediaPlayerControls';
import { ReplayButtonOverlay } from './ReplayButtonOverlay';

let Video: any;
let ViewType: { TEXTURE: any };
if (Platform.OS !== 'web') {
    const module = require('react-native-video');
    Video = require('react-native-video').default;
    ViewType = module.ViewType;
}

type VideoProps = React.ComponentProps<typeof Video>;
type RNVideoResizeMode = VideoProps['resizeMode'];

let ScreenOrientation: {
    lockAsync: (arg0: any) => any;
    OrientationLock: { LANDSCAPE_RIGHT: any; DEFAULT: any };
};
if (Platform.OS !== 'web') {
    ScreenOrientation = require('expo-screen-orientation');
}

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
    isInDetailsModal?: boolean;
    showControls?: boolean;
    onSetShowControls?: (value: React.SetStateAction<boolean>) => void;
};

const NOOP = () => {};

export const NexusVideo: React.FC<NexusVideoProps> = ({
    source,
    style,
    muted = true,
    repeat = false,
    paused = true,
    contentFit = 'cover',
    sliderGesture,
    controls = true,
    isInDetailsModal = false,
    showControls: showControlsProp,
    onSetShowControls = NOOP,
}) => {
    const isWeb = Platform.OS === 'web';
    const webRef = useRef<HTMLVideoElement>(null);
    const wrapperRef = useRef<HTMLElement>(null);
    const insets = useSafeAreaInsets();
    const isComputer = useIsComputer();

    // internal playback state
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [playing, setPlaying] = useState(!paused);
    const [volumeMuted, setVolumeMuted] = useState(muted);
    const [volume, setVolume] = useState(1);
    const [position, setPosition] = useState(0); // ms
    const [totalDuration, setTotalDuration] = useState(0); // ms
    const nativeVideoRef = useRef<any>(null);
    const [internalShowControls, setInternalShowControls] = useState(true);

    const hideControlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(
        null
    );
    const [ended, setEnded] = useState(false);

    const isControlled = showControlsProp !== undefined;
    const showControlsEffective = isControlled
        ? showControlsProp
        : internalShowControls;

    const setShowControlsEffective = useCallback(
        (value: React.SetStateAction<boolean>) => {
            if (isControlled) {
                onSetShowControls(value);
            } else {
                setInternalShowControls(value);
            }
        },
        []
    );

    const toggleControlsInternal = useCallback(() => {
        setShowControlsEffective((s) => !s);
    }, [setShowControlsEffective]);

    const resetControlsTimerInternal = useCallback(() => {
        if (isControlled) {
            onSetShowControls(true);
            if (hideControlsTimeout.current)
                clearTimeout(hideControlsTimeout.current);
            hideControlsTimeout.current = setTimeout(
                () => onSetShowControls(false),
                3000
            );
        } else {
            setInternalShowControls(true);
            if (hideControlsTimeout.current)
                clearTimeout(hideControlsTimeout.current);
            hideControlsTimeout.current = setTimeout(
                () => setInternalShowControls(false),
                3000
            );
        }
    }, [isControlled]);

    useEffect(() => {
        if (playing) {
            resetControlsTimerInternal(); // only kick off when playing in full-screen
        } else {
            if (hideControlsTimeout.current) {
                clearTimeout(hideControlsTimeout.current);
            }
            setShowControlsEffective(true); // always show controls if paused or not FS
        }

        return () => {
            if (hideControlsTimeout.current) {
                clearTimeout(hideControlsTimeout.current);
            }
        };
    }, [
        isFullscreen,
        playing,
        resetControlsTimerInternal,
        setShowControlsEffective,
    ]);

    // Handlers for MediaPlayerControls
    const togglePlay = useCallback(() => {
        setEnded(false);
        setPlaying((p) => {
            const nowPlaying = !p;

            // if we’re starting playback, restart the 3s hide timer
            if (nowPlaying) {
                resetControlsTimerInternal();
            }

            return nowPlaying;
        });
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

    const handleReplay = useCallback(() => {
        // seek back to zero and resume
        if (isWeb) {
            webRef.current!.currentTime = 0;
        } else {
            nativeVideoRef.current!.seek(0);
        }
        setPosition(0);
        setEnded(false);
        setPlaying(true);
    }, [isWeb]);

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

    // Whenever the source (or repeat/paused) changes, re-load without touching ended
    useEffect(() => {
        if (!isWeb) {
            return;
        }
        const v = webRef.current!;
        v.src = source.uri;
        setPlaying(!paused);
        if (paused) {
            v.pause();
        } else {
            void v.play();
        }
    }, [source.uri, paused, isWeb]);

    useEffect(() => {
        if (!isWeb) {
            return;
        }
        const v = webRef.current!;
        v.loop = repeat;
    }, [isWeb, repeat]);

    // Reset ended only when the video source itself changes
    useEffect(() => {
        setEnded(false);
    }, [source.uri]);

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

            const onEnded = () => {
                setPlaying(false);
                setEnded(true);
            };

            v.addEventListener('timeupdate', onTimeUpdate);
            v.addEventListener('loadedmetadata', onLoadedMeta);
            v.addEventListener('ended', onEnded);
            return () => {
                v.removeEventListener('timeupdate', onTimeUpdate);
                v.removeEventListener('loadedmetadata', onLoadedMeta);
                v.removeEventListener('ended', onEnded);
            };
        }
    }, [isWeb]);

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
                    if (playing) resetControlsTimerInternal();
                }}
                onClick={() => {
                    if (isComputer) {
                        togglePlay();
                    } else {
                        toggleControlsInternal();
                    }
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
                        cursor: showControlsEffective
                            ? 'auto'
                            : isFullscreen
                              ? 'none'
                              : 'auto',
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
                {ended && <ReplayButtonOverlay onReplay={handleReplay} />}
                {showControlsEffective && controls && (
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

    const onLoad = (data: any) => {
        setTotalDuration(data.duration * 1000);
    };
    const onProgress = (data: any) => {
        setPosition(data.currentTime * 1000);
    };
    const onEnd = () => {
        setPlaying(false);
        setEnded(true);
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
                    onResponderGrant={() => {
                        if (isFullscreen && playing) {
                            resetControlsTimerInternal();
                        }

                        toggleControlsInternal();
                    }}
                >
                    <Video
                        ref={nativeVideoRef}
                        source={source}
                        style={StyleSheet.absoluteFill}
                        volume={volume}
                        muted={volumeMuted}
                        repeat={repeat && !ended}
                        paused={!playing}
                        resizeMode={
                            contentFit === 'fill' ? 'stretch' : contentFit
                        }
                        onLoad={({ duration }: { duration: number }) =>
                            setTotalDuration(duration * 1000)
                        }
                        onProgress={({
                            currentTime,
                        }: {
                            currentTime: number;
                        }) => setPosition(currentTime * 1000)}
                        onEnd={onEnd}
                    />
                    {ended && <ReplayButtonOverlay onReplay={handleReplay} />}
                    {showControlsEffective ? (
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
        <View
            style={[style as StyleProp<ViewStyle>, { position: 'relative' }]}
            onTouchEnd={(e) => {
                e.stopPropagation();
                if (isInDetailsModal) {
                    toggleControlsInternal();
                }
            }}
        >
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
                {ended && <ReplayButtonOverlay onReplay={handleReplay} />}
            </View>

            {showControlsEffective && controls && (
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
