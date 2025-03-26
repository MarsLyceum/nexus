// ServerMessagesScreen.tsx
import React, { useContext } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { NavigationProp } from '@react-navigation/core';

import { ActiveGroupContext } from '@shared-ui/providers';

import { FeedChannelScreen } from './FeedChannelScreen';
import { TextChannelScreen } from './TextChannelScreen';

type RootStackParamList = {
    ServerMessages: undefined;
};

type ServerMessagesScreenProps = {
    navigation: NavigationProp<RootStackParamList, 'ServerMessages'>;
};

const styles = StyleSheet.create({
    chatContainer: {
        flex: 1,
    },
});

export const ServerMessagesScreen: React.FC<ServerMessagesScreenProps> = ({
    navigation,
}) => {
    // Retrieve the activeChannel from context
    const { activeChannel } = useContext(ActiveGroupContext);

    // If there's no active channel available, show an informational message.
    if (!activeChannel) {
        return (
            <View style={styles.chatContainer}>
                <Text style={{ color: 'white' }}>
                    No active channel selected.
                </Text>
            </View>
        );
    }

    const isFeedChannel = activeChannel.type === 'feed';

    return (
        <View style={styles.chatContainer}>
            {isFeedChannel ? (
                <FeedChannelScreen
                    channel={activeChannel}
                    // @ts-expect-error: Adjust navigation typing as needed.
                    navigation={navigation}
                />
            ) : (
                <TextChannelScreen
                    channel={activeChannel}
                    // @ts-expect-error: Adjust navigation typing as needed.
                    navigation={navigation}
                />
            )}
        </View>
    );
};
