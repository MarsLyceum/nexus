import React from 'react';
import { View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

type NexusVideoProps = {
    source: { uri: string };
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
    // Create the video player instance using expo-video's hook.
    const player = useVideoPlayer(source.uri, (player) => {
        player.loop = repeat;
        player.muted = muted;
        if (!paused) {
            player.play();
        } else {
            player.pause();
        }
    });

    // Render the VideoView from expo-video.
    return (
        <VideoView
            style={style}
            player={player}
            contentFit={contentFit}
            nativeControls={controls}
            allowsFullscreen
        />
    );
};
