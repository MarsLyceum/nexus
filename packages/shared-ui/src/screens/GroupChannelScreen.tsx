// ServerMessagesScreen.tsx
import React, { useContext } from 'react';
import { View, StyleSheet, Text } from 'react-native';

import { ActiveGroupContext } from '../providers';

import { FeedChannelScreen } from './FeedChannelScreen';
import { TextChannelScreen } from './TextChannelScreen';

const styles = StyleSheet.create({
    chatContainer: {
        flex: 1,
    },
});

export const GroupChannelScreen: React.FC = () => {
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
                <FeedChannelScreen channel={activeChannel} />
            ) : (
                <TextChannelScreen channel={activeChannel} />
            )}
        </View>
    );
};
