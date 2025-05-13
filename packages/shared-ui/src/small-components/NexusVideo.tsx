import React from 'react';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Platform } from 'react-native';
import { createNativeWrapper } from 'react-native-gesture-handler';

type NexusVideoProps = {
    source: { uri: string };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    style?: any;
    muted?: boolean;
    repeat?: boolean;
    paused?: boolean;
    contentFit?: 'contain' | 'cover' | 'fill';
    controls?: boolean;
};

const VideoComponent =
    Platform.OS === 'web' ? VideoView : createNativeWrapper(VideoView);

export const NexusVideo: React.FC<NexusVideoProps> = ({
    source,
    style,
    muted = true,
    repeat = true,
    paused = true,
    contentFit = 'cover',
    controls = true,
}) => {
    // Create the video player instance using expo-video's hook.
    const player = useVideoPlayer(source.uri, (_player) => {
        // eslint-disable-next-line no-param-reassign
        _player.loop = repeat;
        // eslint-disable-next-line no-param-reassign
        _player.muted = muted;
        if (!paused) {
            _player.play();
        } else {
            _player.pause();
        }
    });

    const togglePlayback = () => {
        if (player.playing) player.pause();
        else player.play();
    };

    // Render the VideoView from expo-video.
    return (
        <VideoComponent
            style={style}
            player={player}
            contentFit={contentFit}
            nativeControls={controls}
            allowsFullscreen
        />
    );
};
