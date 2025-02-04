import React, { useState, useEffect } from 'react';
import { NavigationProp, RouteProp } from '@react-navigation/core';
import { useApolloClient } from '@apollo/client';
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
import Icon from 'react-native-vector-icons/FontAwesome5';

import { useAppSelector, RootState, UserType } from '../redux';
import { FETCH_CHANNEL_MESSAGES, FETCH_USER_QUERY } from '../queries';
import { COLORS } from '../constants';
import { GroupChannel, GroupChannelMessage } from '../types';

// **Define the type for navigation parameters**
type RootStackParamList = {
    ServerMessages: { channel: GroupChannel };
    // Add other routes and their params here if necessary
};

// **Define the props interface**
type ServerMessagesScreenProps = {
    navigation: NavigationProp<RootStackParamList, 'ServerMessages'>;
    route: RouteProp<RootStackParamList, 'ServerMessages'>;
    activeChannel: GroupChannel;
};

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

const formatDateTime = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours() % 12 || 12;
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';

    return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
};

type MessageWithAvatar = GroupChannelMessage & {
    avatar: string;
    username: string;
};

export const ServerMessagesScreen: React.FC<ServerMessagesScreenProps> = ({
    route,
    activeChannel,
    navigation,
}) => {
    const user: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );
    // Prefer channel from route if available; otherwise fallback to activeChannel
    const channel = route?.params?.channel || activeChannel;
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;

    const apolloClient = useApolloClient();
    const [messageText, setMessageText] = useState('');
    const [chatMessages, setChatMessages] = useState<MessageWithAvatar[]>([]);

    useEffect(() => {
        // Immediately invoke an async function inside the effect.
        // eslint-disable-next-line no-void
        void (async () => {
            const fetchMessagesResult = await apolloClient.query({
                query: FETCH_CHANNEL_MESSAGES,
                variables: {
                    channelId: channel?.id,
                    offset: 0,
                },
            });

            // Adjust this if your query returns an object containing an array.
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            const messagesArray = fetchMessagesResult.data.fetchChannelMessages;

            const messages = await Promise.all(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                messagesArray.map(async (msg: GroupChannelMessage) => {
                    const fetchUserResult = await apolloClient.query({
                        query: FETCH_USER_QUERY,
                        variables: {
                            userId: msg.postedByUserId,
                        },
                    });

                    return {
                        ...msg,
                        postedAt: new Date(msg.postedAt),
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        username: fetchUserResult.data.fetchUser.username,
                        avatar: 'https://picsum.photos/50?random=10',
                    };
                })
            );

            setChatMessages(messages);
        })();
    }, [JSON.stringify(channel)]);

    const sendMessage = () => {
        if (!messageText.trim()) return;

        const newMessage: MessageWithAvatar = {
            id: `${chatMessages.length + 1}`,
            username: user?.username ?? 'You',
            postedByUserId: user?.id ?? '',
            postedAt: new Date(),
            content: messageText.trim(),
            avatar: 'https://picsum.photos/50?random=10',
            edited: false,
            channel,
            channelId: channel.id,
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
                <Text style={styles.channelName}># {channel.name}</Text>
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
                                {item.username}{' '}
                                <Text style={styles.time}>
                                    {formatDateTime(item.postedAt)}
                                </Text>
                            </Text>
                            <Text style={styles.messageText}>
                                {item.content}
                            </Text>
                        </View>
                    </View>
                )}
            />

            {/* Message Input */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder={`Message #${channel.name}`}
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
