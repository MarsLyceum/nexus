import React, { useState, useEffect, useRef } from 'react';
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
import { GroupChannel, GroupChannelMessage, User } from '../types';

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
    largeScreenContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: COLORS.PrimaryBackground,
    },
    sidebarContainer: {
        width: 250,
        backgroundColor: COLORS.PrimaryBackground,
    },
    chatWrapper: {
        flex: 1,
        backgroundColor: COLORS.PrimaryBackground,
    },
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
    const [offset, setOffset] = useState(0);
    const limit = 100;
    const [loadingMore, setLoadingMore] = useState(false);

    // Create a cache for usernames
    const userCacheRef = useRef<Record<string, string>>({});

    // Fetch messages when the channel or offset changes
    useEffect(() => {
        let cancelled = false;
        const fetchMessages = async () => {
            try {
                const fetchMessagesResult = await apolloClient.query<{
                    fetchChannelMessages: GroupChannelMessage;
                }>({
                    query: FETCH_CHANNEL_MESSAGES,
                    variables: {
                        channelId: channel?.id,
                        offset, // Fetch messages in batches of 100
                    },
                });

                // Assume the query returns an array
                const messagesArray =
                    fetchMessagesResult.data.fetchChannelMessages;
                if (!Array.isArray(messagesArray)) {
                    console.error(
                        'Expected fetchChannelMessages to be an array.'
                    );
                    return;
                }

                // Map each message to add avatar and username (using the cache)
                const newMessages = await Promise.all(
                    messagesArray.map(async (msg: GroupChannelMessage) => {
                        // Check if the username for this user is already cached
                        if (userCacheRef.current[msg.postedByUserId]) {
                            return {
                                ...msg,
                                postedAt: new Date(msg.postedAt),
                                username:
                                    userCacheRef.current[msg.postedByUserId],
                                avatar: 'https://picsum.photos/50?random=10',
                            };
                        }

                        // Fetch the username and store it in the cache
                        const fetchUserResult = await apolloClient.query<{
                            fetchUser: User;
                        }>({
                            query: FETCH_USER_QUERY,
                            variables: {
                                userId: msg.postedByUserId,
                            },
                        });
                        const fetchedUsername =
                            fetchUserResult.data.fetchUser.username;
                        userCacheRef.current[msg.postedByUserId] =
                            fetchedUsername;
                        return {
                            ...msg,
                            postedAt: new Date(msg.postedAt),
                            username: fetchedUsername,
                            avatar: 'https://picsum.photos/50?random=10',
                        };
                    })
                );

                // If offset is 0, this is the initial load, so replace.
                // For offset > 0, append new messages to cached ones.
                if (!cancelled) {
                    if (offset === 0) {
                        setChatMessages(newMessages);
                    } else {
                        setChatMessages((prevMessages) => [
                            ...prevMessages,
                            ...newMessages,
                        ]);
                    }
                }
            } catch (error) {
                console.error('Error fetching messages:', error);
            } finally {
                setLoadingMore(false);
            }
        };

        // eslint-disable-next-line no-void
        void fetchMessages();

        return () => {
            cancelled = true;
        };
    }, [JSON.stringify(channel), offset]);

    // When scrolling up (end of the inverted list), load more messages
    const loadMoreMessages = () => {
        if (loadingMore) return;
        setLoadingMore(true);
        setOffset((prevOffset) => prevOffset + limit);
    };

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

        // Prepend the new message (assuming new messages should appear at the bottom of an inverted list)
        setChatMessages((prevMessages) => [newMessage, ...prevMessages]);
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
                inverted
                onEndReached={loadMoreMessages}
                onEndReachedThreshold={0.1}
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
