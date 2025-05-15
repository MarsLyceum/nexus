// apps/mobile/src/components/NexusVideo.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Platform, View, StyleProp, ViewStyle } from 'react-native';
import Video, { OnLoadData, OnProgressData } from 'react-native-video';
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
};

export const NexusVideo: React.FC<NexusVideoProps> = ({
    source,
    style,
    muted = true,
    repeat = true,
    paused = true,
    contentFit = 'cover',
    controls = true,
}) => {
    const isWeb = Platform.OS === 'web';
    const webRef = useRef<HTMLVideoElement>(null);

    // internal playback state
    const [playing, setPlaying] = useState(!paused);
    const [position, setPosition] = useState(0); // ms
    const [totalDuration, setTotalDuration] = useState(0); // ms

    // Handlers for MediaPlayerControls
    const togglePlay = useCallback(() => {
        setPlaying((p) => !p);
    }, []);
    const onSeekStart = useCallback(() => {
        // optionally pause while dragging
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
        },
        [playing, isWeb]
    );

    // Sync props → <video> attributes
    useEffect(() => {
        if (isWeb) {
            const v = webRef.current!;
            v.src = source.uri;
            v.muted = muted;
            v.loop = repeat;
            setPlaying(!paused);
            if (paused) v.pause();
            else void v.play();
        }
    }, [source.uri, muted, repeat, paused, isWeb]);

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
                        }}
                    >
                        <MediaPlayerControls
                            playing={playing}
                            position={position}
                            totalDuration={totalDuration}
                            onTogglePlay={togglePlay}
                            onSlidingStart={onSeekStart}
                            onValueChange={onSeek}
                            onSlidingComplete={onSeekComplete}
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
                { position: 'relative', overflow: 'hidden' },
            ]}
        >
            <Video
                source={source}
                style={{ width: '100%', height: '100%' }}
                muted={muted}
                repeat={repeat}
                paused={!playing}
                resizeMode={resizeMode}
                controls={false}
                onLoad={onLoad}
                onProgress={onProgress}
                onEnd={onEnd}
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
                    }}
                >
                    <MediaPlayerControls
                        playing={playing}
                        position={position}
                        totalDuration={totalDuration}
                        onTogglePlay={togglePlay}
                        onSlidingStart={onSeekStart}
                        onValueChange={onSeek}
                        onSlidingComplete={onSeekComplete}
                    />
                </View>
            )}
        </View>
    );
};
