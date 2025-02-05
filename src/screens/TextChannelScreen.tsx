import React, { useState, useEffect, useRef } from 'react';
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
import { useApolloClient } from '@apollo/client';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { BackArrow } from '../buttons';
import { useAppSelector, RootState, UserType } from '../redux';
import { Header } from '../sections';
import {
    FETCH_CHANNEL_MESSAGES_QUERY,
    FETCH_USER_QUERY,
    CREATE_GROUP_CHANNEL_MESSAGE_MUTATION,
} from '../queries';
import { COLORS } from '../constants';
import { GroupChannel, GroupChannelMessage, User } from '../types';

export type MessageWithAvatar = GroupChannelMessage & {
    avatar: string;
    username: string;
};

type TextChannelScreenProps = {
    channel: GroupChannel;
    navigation: any;
};

const styles = StyleSheet.create({
    chatContainer: {
        flex: 1,
        backgroundColor: COLORS.SecondaryBackground,
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
        backgroundColor: COLORS.SecondaryBackground,
    },
    input: {
        flex: 1,
        backgroundColor: COLORS.TextInput,
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

export const TextChannelScreen: React.FC<TextChannelScreenProps> = ({
    channel,
    navigation,
}) => {
    const user: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );
    const apolloClient = useApolloClient();
    const [messageText, setMessageText] = useState('');
    const [chatMessages, setChatMessages] = useState<MessageWithAvatar[]>([]);
    const [offset, setOffset] = useState(0);
    const limit = 100;
    const [loadingMore, setLoadingMore] = useState(false);
    const userCacheRef = useRef<Record<string, string>>({});
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;
    const flatListRef = useRef<FlatList<MessageWithAvatar> | null>(null);

    useEffect(() => {
        let cancelled = false;
        const fetchMessages = async () => {
            try {
                const fetchMessagesResult = await apolloClient.query<{
                    fetchChannelMessages: GroupChannelMessage[];
                }>({
                    query: FETCH_CHANNEL_MESSAGES_QUERY,
                    variables: {
                        channelId: channel.id,
                        offset,
                    },
                    fetchPolicy: 'network-only',
                });

                const messagesArray =
                    fetchMessagesResult.data.fetchChannelMessages;
                if (!Array.isArray(messagesArray)) {
                    console.error(
                        'Expected fetchChannelMessages to be an array.'
                    );
                    return;
                }

                const newMessages: MessageWithAvatar[] = await Promise.all(
                    messagesArray.map(async (msg: GroupChannelMessage) => {
                        if (userCacheRef.current[msg.postedByUserId]) {
                            return {
                                ...msg,
                                postedAt: new Date(msg.postedAt),
                                username:
                                    userCacheRef.current[msg.postedByUserId],
                                avatar: 'https://picsum.photos/50?random=10',
                            };
                        }

                        const fetchUserResult = await apolloClient.query<{
                            fetchUser: User;
                        }>({
                            query: FETCH_USER_QUERY,
                            variables: { userId: msg.postedByUserId },
                            fetchPolicy: 'network-only',
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

                if (!cancelled) {
                    if (offset === 0) {
                        setChatMessages(newMessages);
                    } else {
                        setChatMessages((prev) => [...prev, ...newMessages]);
                    }
                }
            } catch (error) {
                console.error('Error fetching messages:', error);
            } finally {
                setLoadingMore(false);
            }
        };

        void fetchMessages();
        return () => {
            cancelled = true;
        };
    }, [channel, offset, refreshTrigger, apolloClient]);

    useEffect(() => {
        if (flatListRef.current) {
            setTimeout(
                () => flatListRef.current?.scrollToEnd({ animated: true }),
                100
            );
        }
    }, [chatMessages]);

    const loadMoreMessages = () => {
        if (loadingMore) return;
        setLoadingMore(true);
        setOffset((prev) => prev + limit);
    };

    const sendMessage = async () => {
        if (!messageText.trim()) return;
        try {
            await apolloClient.mutate({
                mutation: CREATE_GROUP_CHANNEL_MESSAGE_MUTATION,
                variables: {
                    postedByUserId: user?.id,
                    channelId: channel.id,
                    content: messageText.trim(),
                },
            });
            setMessageText('');
            Keyboard.dismiss();
            setOffset(0);
            setRefreshTrigger((prev) => prev + 1);
        } catch (error) {
            console.error('Error creating message:', error);
        }
    };

    return (
        <View style={styles.chatContainer}>
            <Header
                isLargeScreen={isLargeScreen}
                channel={channel}
                navigation={navigation}
            />

            {/* Chat Messages */}
            <FlatList
                ref={flatListRef}
                data={[...chatMessages].reverse()}
                keyExtractor={(item) => item.id}
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
                    placeholder={`Message ${channel.name}`}
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
