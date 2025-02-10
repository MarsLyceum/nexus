// ServerMessagesScreen.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationProp, RouteProp } from '@react-navigation/core';
import { FeedChannelScreen } from './FeedChannelScreen';
import { TextChannelScreen } from './TextChannelScreen';
import { GroupChannel, Group } from '../types';

type RootStackParamList = {
    ServerMessages: { channel: GroupChannel; group: Group };
};

type ServerMessagesScreenProps = {
    navigation: NavigationProp<RootStackParamList, 'ServerMessages'>;
    route: RouteProp<RootStackParamList, 'ServerMessages'>;
    activeChannel: GroupChannel;
};

const styles = StyleSheet.create({
    chatContainer: {
        flex: 1,
    },
});

export const ServerMessagesScreen: React.FC<ServerMessagesScreenProps> = ({
    route,
    activeChannel,
    navigation,
}) => {
    // Determine the channel either from route params or from the activeChannel prop.
    const channel = route?.params?.channel || activeChannel;
    const isFeedChannel = channel.type === 'feed';

    // On large screens (or non-feed channels), render the appropriate screen inline.
    return (
        <View style={styles.chatContainer}>
            {isFeedChannel ? (
                // @ts-expect-error navigation is a different type
                <FeedChannelScreen channel={channel} navigation={navigation} />
            ) : (
                <TextChannelScreen channel={channel} navigation={navigation} />
            )}
        </View>
    );
};
