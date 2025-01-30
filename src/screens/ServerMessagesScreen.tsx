import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    Image,
    useWindowDimensions,
    Keyboard,
    StyleSheet,
    Platform,
} from 'react-native';
import { COLORS } from '../constants';
import Icon from 'react-native-vector-icons/FontAwesome5';

// **Messages (dummy data)**
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

export const ServerMessagesScreen = ({ route, activeChannel, navigation }) => {
    const channel = route?.params?.channel || activeChannel;
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;

    const [messageText, setMessageText] = useState('');
    const [chatMessages, setChatMessages] = useState(messages);

    const formatDateTime = () => {
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const year = now.getFullYear();
        const hours = now.getHours() % 12 || 12;
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const ampm = now.getHours() >= 12 ? 'PM' : 'AM';

        return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
    };

    const sendMessage = () => {
        if (!messageText.trim()) return;

        const newMessage = {
            id: `${chatMessages.length + 1}`,
            user: 'You',
            time: formatDateTime(),
            text: messageText.trim(),
            avatar: 'https://picsum.photos/50?random=10',
        };

        setChatMessages((prevMessages) => [...prevMessages, newMessage]);
        setMessageText('');
        Keyboard.dismiss();
    };

    return (
        <View style={styles.chatContainer}>
            {/* Header with Back Button */}
            <View style={styles.header}>
                {!isLargeScreen && (
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Icon name="arrow-left" size={20} color="white" />
                    </TouchableOpacity>
                )}
                <Text style={styles.channelName}># {channel}</Text>
            </View>

            {/* Chat Messages */}
            <FlatList
                data={chatMessages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.messageContainer}>
                        <Image
                            source={{ uri: item.avatar }}
                            style={styles.avatar}
                        />
                        <View style={styles.messageContent}>
                            <Text style={styles.userName}>
                                {item.user}{' '}
                                <Text style={styles.time}>{item.time}</Text>
                            </Text>
                            <Text style={styles.messageText}>{item.text}</Text>
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
                    onSubmitEditing={sendMessage}
                    returnKeyType="send"
                />
                {messageText.length > 0 && Platform.OS !== 'web' && (
                    <TouchableOpacity
                        onPress={sendMessage}
                        style={styles.sendButton}
                    >
                        <Icon name="paper-plane" size={18} color="white" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

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
