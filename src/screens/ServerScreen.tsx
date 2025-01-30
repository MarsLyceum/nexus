import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Image,
    useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { COLORS } from '../constants';

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
                            navigation.navigate('Chat', { channel: item.name });
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

// **Chat Screen**
const ChatScreen = ({ route, activeChannel, navigation }) => {
    const channel = route?.params?.channel || activeChannel;
    const [messageText, setMessageText] = useState('');

    return (
        <View style={styles.chatContainer}>
            {/* Header with Back Button */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Icon name="arrow-left" size={20} color="white" />
                </TouchableOpacity>
                <Text style={styles.channelName}># {channel}</Text>
            </View>

            {/* Chat Messages */}
            <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.messageContainer}>
                        <Image
                            source={{ uri: item.avatar }}
                            defaultSource={require('../../assets/default-avatar.png')} // Fallback image
                            style={styles.avatar}
                        />
                        <View style={styles.messageContent}>
                            <Text style={styles.userName}>
                                {item.user}{' '}
                                <Text style={styles.time}>{item.time}</Text>
                            </Text>
                            <Text style={styles.messageText}>{item.text}</Text>
                            {item.edited && (
                                <Text style={styles.editedLabel}>(edited)</Text>
                            )}
                        </View>
                    </View>
                )}
            />

            {/* Message Input */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder={`Message #${channel}`}
                    placeholderTextColor="gray"
                    value={messageText}
                    onChangeText={setMessageText}
                />
            </View>
        </View>
    );
};

// **Main Server Screen Component**
export function ServerScreen({ navigation }) {
    const { width } = useWindowDimensions();
    const [activeChannel, setActiveChannel] = useState('general');

    // If the screen width is large, show side-by-side layout
    if (width > 768) {
        return (
            <View style={styles.largeScreenContainer}>
                <ChannelList
                    navigation={navigation}
                    activeChannel={activeChannel}
                    setActiveChannel={setActiveChannel}
                />
                <ChatScreen
                    activeChannel={activeChannel}
                    navigation={navigation}
                />
            </View>
        );
    }

    // On smaller screens, use Stack Navigation
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Channels">
                {(props) => (
                    <ChannelList
                        {...props}
                        activeChannel={activeChannel}
                        setActiveChannel={setActiveChannel}
                    />
                )}
            </Stack.Screen>
            <Stack.Screen name="Chat">
                {(props) => (
                    <ChatScreen {...props} activeChannel={activeChannel} />
                )}
            </Stack.Screen>
        </Stack.Navigator>
    );
}

// **Messages**
const messages = [
    {
        id: '1',
        user: 'Sarge',
        time: '01/24/2025 9:50 AM',
        text: 'Game still ago?',
        avatar: 'https://picsum.photos/50?random=1',
    },
    {
        id: '2',
        user: 'hakeem',
        time: '01/24/2025 9:59 AM',
        text: 'Probably, I’ll be attending a wedding so the game will have to start later than usual by anywhere from 30 to 60 minutes, might even run something else',
        avatar: 'https://picsum.photos/50?random=2',
    },
    {
        id: '3',
        user: 'DC - Pierre',
        time: '01/24/2025 10:21 AM',
        text: 'If you’re attending a wedding you don’t want to give it a miss this week and go enjoy yourself? I’m sure everyone would understand, RL comes first right?',
        avatar: 'https://picsum.photos/50?random=3',
        edited: true,
    },
];

// **Styles**
const styles = StyleSheet.create({
    largeScreenContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    channelListContainer: {
        width: 250,
        backgroundColor: COLORS.PrimaryBackground,
        padding: 20,
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
    serverTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 20,
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
    editedLabel: {
        fontSize: 12,
        color: 'gray',
        marginTop: 2,
    },
    inputContainer: {
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#4A3A5A',
        backgroundColor: COLORS.PrimaryBackground,
    },
    input: {
        backgroundColor: '#3A2A4A',
        color: 'white',
        padding: 10,
        borderRadius: 20,
        fontSize: 14,
    },
});

export default ServerScreen;
