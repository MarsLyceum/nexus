import React, { useState } from 'react';
import { NavigationProp, RouteProp } from '@react-navigation/core';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { COLORS } from '../constants';
import { ServerMessagesScreen } from './ServerMessagesScreen';

const styles = StyleSheet.create({
    largeScreenContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: COLORS.PrimaryBackground,
    },
    // This is the fixed-width sidebar for large screens
    sidebarContainer: {
        width: 250,
        backgroundColor: COLORS.PrimaryBackground,
    },
    // This is the remaining chat area on large screens
    chatWrapper: {
        flex: 1,
        backgroundColor: COLORS.PrimaryBackground,
    },

    // On small screens, this container now flexes to fill (no fixed width)
    channelListContainer: {
        flex: 1,
        backgroundColor: COLORS.PrimaryBackground,
        padding: 20,
    },
    serverTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 20,
    },
    chatContainer: {
        flex: 1,
        backgroundColor: COLORS.PrimaryBackground,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#4A3A5A',
    },
    backButton: {
        marginRight: 10,
    },
    channelName: {
        fontSize: 18,
        color: 'white',
        fontWeight: 'bold',
    },
    channelItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8, // Added for better touch area
    },
    activeChannelItem: {
        backgroundColor: COLORS.SecondaryBackground,
        borderRadius: 5,
    },
    activeChannelItemWrapper: {
        backgroundColor: COLORS.SecondaryBackground,
        padding: 4,
        marginVertical: 2,
        borderRadius: 5,
    },
    icon: {
        marginRight: 10,
    },
    channelText: {
        fontSize: 16,
        color: 'gray',
    },
    activeChannelText: {
        color: 'white',
        fontWeight: 'bold',
    },
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 15,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    messageContent: {
        flex: 1,
    },
    userName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'white',
    },
    time: {
        fontSize: 12,
        color: 'gray',
    },
    messageText: {
        fontSize: 14,
        color: 'white',
        marginTop: 2,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#4A3A5A',
        backgroundColor: COLORS.PrimaryBackground,
    },
    input: {
        flex: 1,
        backgroundColor: '#3A2A4A',
        color: 'white',
        padding: 10,
        borderRadius: 20,
        fontSize: 14,
    },
    sendButton: {
        marginLeft: 10,
        padding: 8,
    },
});

// **Channel List**
const initialChannels = [
    { id: '1', name: 'general' },
    { id: '2', name: 'references' },
    { id: '3', name: 'shopping' },
    { id: '4', name: 'events' },
    { id: '5', name: 'character creation' },
];

const ChannelList = ({
    navigation,
    activeChannel,
    setActiveChannel,
    isLargeScreen,
}: {
    navigation: NavigationProp<Record<string, unknown>>;
    activeChannel: string;
    setActiveChannel: (arg: string) => unknown;
    isLargeScreen: boolean;
}) => (
    <View style={styles.channelListContainer}>
        <Text style={styles.serverTitle}>The Traveler Campaign</Text>
        <FlatList
            data={initialChannels}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <View
                    style={[
                        activeChannel === item.name &&
                            styles.activeChannelItemWrapper,
                    ]}
                >
                    <TouchableOpacity
                        style={styles.channelItem}
                        onPress={() => {
                            setActiveChannel(item.name);
                            if (!isLargeScreen) {
                                navigation.navigate('ServerMessages', {
                                    channel: item.name,
                                });
                            }
                        }}
                    >
                        <Icon
                            name="comment"
                            size={16}
                            color={
                                activeChannel === item.name
                                    ? COLORS.White
                                    : COLORS.InactiveText
                            }
                            style={styles.icon}
                        />
                        <Text
                            style={[
                                styles.channelText,
                                activeChannel === item.name &&
                                    styles.activeChannelText,
                            ]}
                        >
                            {item.name}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        />
    </View>
);

type RootStackParamList = {
    ServerMessages: { channel: string };
};

// **Main Server Screen Component**
export function ServerScreen({
    navigation,
    route,
}: Readonly<{
    route: RouteProp<RootStackParamList, 'ServerMessages'>;
    navigation: NavigationProp<RootStackParamList, 'ServerMessages'>;
}>) {
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;
    const [activeChannel, setActiveChannel] = useState('general');

    // For large screens, show side-by-side layout:
    if (isLargeScreen) {
        return (
            <View style={styles.largeScreenContainer}>
                {/* Fixed-width sidebar for channels */}
                <View style={styles.sidebarContainer}>
                    <ChannelList
                        navigation={navigation}
                        isLargeScreen={isLargeScreen}
                        activeChannel={activeChannel}
                        setActiveChannel={setActiveChannel}
                    />
                </View>

                {/* The rest is chat */}
                <View style={styles.chatWrapper}>
                    <ServerMessagesScreen
                        route={route}
                        activeChannel={activeChannel}
                        navigation={navigation}
                    />
                </View>
            </View>
        );
    }

    // Otherwise, use stack screens on smaller devices
    return (
        <ChannelList
            navigation={navigation}
            activeChannel={activeChannel}
            setActiveChannel={setActiveChannel}
            isLargeScreen={isLargeScreen} // Ensure isLargeScreen is passed
        />
    );
}
