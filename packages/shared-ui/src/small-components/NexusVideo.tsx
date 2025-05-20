// apps/mobile/src/components/NexusVideo.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Platform, View, StyleProp, ViewStyle } from 'react-native';

import Video, {
    OnLoadData,
    OnProgressData,
    VideoRef,
    ViewType,
} from 'react-native-video';
import { NativeGesture } from 'react-native-gesture-handler';
import { MediaPlayerControls } from './MediaPlayerControls';

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

    // internal playback state
    const [playing, setPlaying] = useState(!paused);
    const [volumeMuted, setVolumeMuted] = useState(muted);
    const [volume, setVolume] = useState(1);
    const [position, setPosition] = useState(0); // ms
    const [totalDuration, setTotalDuration] = useState(0); // ms
    const nativeVideoRef = useRef<VideoRef>(null);

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
                style={[
                    style as StyleProp<ViewStyle>,
                    { position: 'relative', overflow: 'hidden' },
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
                {controls && (
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

    return (
        <View
            style={[
                style as StyleProp<ViewStyle>,
                { position: 'relative', overflow: 'hidden', borderRadius: 8 },
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
            {controls && (
                <View
                    style={{
                        position: 'absolute',
                        bottom: 8,
                        left: 0,
                        right: 0,
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        zIndex: 999,
                        elevation: 10,
                    }}
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
                    />
                </View>
            )}
        </View>
    );
};
