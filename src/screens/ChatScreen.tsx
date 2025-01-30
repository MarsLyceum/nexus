import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    FlatList,
    TextInput,
    TouchableOpacity,
    Platform,
    useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

import { COLORS } from '../constants';

// Detect if the device is a mobile or tablet
const isMobileOrTablet = Platform.OS === 'ios' || Platform.OS === 'android';

export const ChatScreen = ({ route, navigation }) => {
    const { user } = route.params || { user: { name: 'Unknown', avatar: '' } };
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;

    const [messageText, setMessageText] = useState('');
    const [messages, setMessages] = useState([
        {
            id: '1',
            user: 'CaptCrunch',
            time: '01/22/2025 7:12 AM',
            text: 'Its free on Steam atm if you want to install it ahead of time',
            avatar: 'https://picsum.photos/50?random=1',
            edited: false,
        },
        {
            id: '2',
            user: 'Milheht',
            time: '01/22/2025 7:12 AM',
            text: "Ok cool I'll install it then",
            avatar: 'https://picsum.photos/50?random=2',
            edited: false,
        },
        {
            id: '3',
            user: 'CaptCrunch',
            time: '01/25/2025 11:32 PM',
            text: 'Do you like PoE2 by the way?',
            avatar: 'https://picsum.photos/50?random=1',
            edited: true,
        },
        {
            id: '4',
            user: 'CaptCrunch',
            time: '01/25/2025 11:35 PM',
            text: "He's been really caught up in other things besides games though so I wouldn't hold my breath on him joining, but maybe I can twist his arm lol",
            avatar: 'https://picsum.photos/50?random=1',
            edited: false,
        },
        {
            id: '5',
            user: 'Milheht',
            time: '01/26/2025 7:31 AM',
            text: "Yeah I like PoE2 but it's really difficult and I'm currently stuck on a boss. It would be fun to play it sometime though.",
            avatar: 'https://picsum.photos/50?random=2',
            edited: false,
        },
    ]);

    const sendMessage = () => {
        if (!messageText.trim()) return;

        const newMessage = {
            id: Math.random().toString(),
            user: 'You',
            time: new Date().toLocaleString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            }),
            text: messageText,
            avatar: 'https://picsum.photos/50?random=99',
            edited: false,
        };

        setMessages((prevMessages) => [...prevMessages, newMessage]);
        setMessageText('');
    };

    return (
        <View style={styles.chatContainer}>
            {/* Chat Header */}
            <View style={styles.chatHeader}>
                {!isLargeScreen && (
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Icon name="arrow-left" size={20} color="white" />
                    </TouchableOpacity>
                )}
                <Image
                    source={{ uri: user.avatar }}
                    style={styles.headerAvatar}
                />
                <Text style={styles.chatTitle}>{user.name}</Text>
            </View>

            {/* Chat Messages */}
            <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.messageContainer}>
                        <Image
                            source={{ uri: item.avatar }}
                            style={styles.messageAvatar}
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
                    placeholder={`Message #${user.name}`}
                    placeholderTextColor="gray"
                    value={messageText}
                    onChangeText={setMessageText}
                    onSubmitEditing={
                        !isMobileOrTablet ? sendMessage : undefined
                    } // Desktop: Send on Enter
                    returnKeyType={!isMobileOrTablet ? 'default' : 'send'}
                />
                {/* Show send button ONLY on mobile and tablets */}
                {isMobileOrTablet && messageText.length > 0 && (
                    <TouchableOpacity
                        onPress={sendMessage}
                        style={styles.sendButton}
                    >
                        <Icon name="paper-plane" size={20} color="white" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

// **💅 Styles**
const styles = StyleSheet.create({
    chatContainer: {
        flex: 1,
        backgroundColor: COLORS.PrimaryBackground,
    },
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.PrimaryBackground,
        borderColor: COLORS.InactiveText,
        borderBottomWidth: 1,
        padding: 15,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginLeft: 10,
    },
    chatTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginLeft: 10,
    },
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 15,
    },
    messageAvatar: {
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
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.InactiveText,
        backgroundColor: COLORS.PrimaryBackground,
    },
    input: {
        flex: 1,
        backgroundColor: COLORS.SecondaryBackground,
        color: 'white',
        padding: 10,
        borderRadius: 20,
        fontSize: 14,
        marginRight: 10,
    },
    sendButton: {
        padding: 10,
    },
});

export default ChatScreen;
