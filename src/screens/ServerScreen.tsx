import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
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

const Stack = createStackNavigator();

// **Channel List**
const initialChannels = [
    { id: '1', name: 'general' },
    { id: '2', name: 'references' },
    { id: '3', name: 'shopping' },
    { id: '4', name: 'events' },
    { id: '5', name: 'character creation' },
];

const ChannelList = ({ navigation, activeChannel, setActiveChannel }) => {
    return (
        // Let this fill its parent so on small screens, it covers the full page
        <View style={styles.channelListContainer}>
            <Text style={styles.serverTitle}>The Traveler Campaign</Text>
            <FlatList
                data={initialChannels}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.channelItem,
                            activeChannel === item.name &&
                                styles.activeChannelItem,
                        ]}
                        onPress={() => {
                            setActiveChannel(item.name);
                            navigation.navigate('ServerMessages', {
                                channel: item.name,
                            });
                        }}
                    >
                        <Icon
                            name="comment"
                            size={16}
                            color={
                                activeChannel === item.name ? 'white' : 'gray'
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
                )}
            />
        </View>
    );
};

// **Main Server Screen Component**
export function ServerScreen({ navigation }) {
    const { width } = useWindowDimensions();
    const [activeChannel, setActiveChannel] = useState('general');

    // For large screens, show side-by-side layout:
    if (width > 768) {
        return (
            <View style={styles.largeScreenContainer}>
                {/* Fixed-width sidebar for channels */}
                <View style={styles.sidebarContainer}>
                    <ChannelList
                        navigation={navigation}
                        activeChannel={activeChannel}
                        setActiveChannel={setActiveChannel}
                    />
                </View>

                {/* The rest is chat */}
                <View style={styles.chatWrapper}>
                    <ServerMessagesScreen
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
        />
    );
}

// **Styles**
const styles = StyleSheet.create({
    // Fill entire screen with background color
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
    },
    activeChannelItem: {
        backgroundColor: '#3A2A4A',
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

export default ServerScreen;
