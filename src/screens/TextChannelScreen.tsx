// TextChannelScreen.tsx
import React, { useState, useEffect, useRef, useContext } from 'react';
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
import { NavigationProp } from '@react-navigation/core';
import { useApolloClient } from '@apollo/client';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useAppSelector, RootState, UserType } from '../redux';
import { Header } from '../sections';
import { useSearchFilter } from '../hooks/useSearchFilter';
import { SearchContext } from '../providers'; // Using the shared context
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
    navigation: NavigationProp<Record<string, unknown>>;
};

const formatDateTime = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours() % 12 || 12;
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
};

/**
 * SkeletonMessageItem mimics a chat message while loading.
 * It uses your palette (e.g. COLORS.InactiveText) for the placeholder blocks.
 */
const SkeletonMessageItem: React.FC = () => (
    <View style={styles.skeletonMessageContainer}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonMessageContent}>
            <View style={styles.skeletonUsername} />
            <View style={styles.skeletonTime} />
            <View style={styles.skeletonText} />
        </View>
    </View>
);

export const TextChannelScreen: React.FC<TextChannelScreenProps> = ({
    channel,
    navigation,
}) => {
    // Get the current user from Redux
    const user: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );
    const apolloClient = useApolloClient();

    // Local state for sending messages
    const [messageText, setMessageText] = useState('');
    const [chatMessages, setChatMessages] = useState<MessageWithAvatar[]>([]);
    const [offset, setOffset] = useState(0);
    const limit = 100;
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState<boolean>(true);
    const userCacheRef = useRef<Record<string, string>>({});
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;
    const flatListRef = useRef<FlatList<MessageWithAvatar> | null>(null);

    // Read the shared search text from context (no local search box here)
    const { searchText } = useContext(SearchContext);

    // Filter messages by content and username using the shared search text
    const filteredMessages = useSearchFilter(chatMessages, searchText, [
        'content',
        'username',
    ]);

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
                if (offset === 0) {
                    setLoadingMessages(false);
                }
                setLoadingMore(false);
            }
        };

        // eslint-disable-next-line no-void
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
            {/* Header rendered by this screen */}
            <Header
                isLargeScreen={isLargeScreen}
                headerText={channel.name}
                navigation={navigation}
            />

            {/* Chat Messages */}
            {loadingMessages ? (
                // Render 5 skeleton message placeholders while loading
                <FlatList
                    data={[0, 1, 2, 3, 4]}
                    keyExtractor={(item) => item.toString()}
                    renderItem={() => <SkeletonMessageItem />}
                    contentContainerStyle={{ paddingBottom: 80 }}
                />
            ) : (
                <FlatList
                    ref={flatListRef}
                    // Render filtered messages (newest at the bottom)
                    data={[...filteredMessages].reverse()}
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
            )}

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
    // Skeleton styles for chat messages
    skeletonMessageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 15,
    },
    skeletonAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.InactiveText,
        marginRight: 10,
    },
    skeletonMessageContent: {
        flex: 1,
    },
    skeletonUsername: {
        width: 120,
        height: 14,
        borderRadius: 4,
        backgroundColor: COLORS.InactiveText,
        marginBottom: 4,
    },
    skeletonTime: {
        width: 60,
        height: 10,
        borderRadius: 4,
        backgroundColor: COLORS.InactiveText,
        marginBottom: 4,
    },
    skeletonText: {
        width: '80%',
        height: 14,
        borderRadius: 4,
        backgroundColor: COLORS.InactiveText,
    },
});
