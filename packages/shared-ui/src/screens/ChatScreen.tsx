import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    useWindowDimensions,
    SafeAreaView,
    FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useSearchParams } from 'solito/navigation';
import { useQuery, useApolloClient, useMutation } from '@apollo/client';
import { v4 as uuidv4 } from 'uuid';

import { useNexusRouter } from '../hooks';
import { COLORS } from '../constants';
import {
    ChatInputContainer,
    NexusImage,
    MessageItem,
} from '../small-components';
import { useAppSelector, RootState, UserType } from '../redux';
import {
    FETCH_USER_QUERY,
    SEND_MESSAGE,
    GET_CONVERSATION_MESSAGES,
} from '../queries';
import { Message, Conversation, DirectMessageWithAvatar } from '../types';
import { getOnlineStatusDotColor } from '../utils';

interface ChatScreenProps {
    conversation?: Conversation;
}

// Skeleton screen component to show loading placeholders.
const SkeletonMessageItem: React.FC = () => {
    return (
        <View style={styles.skeletonContainer}>
            <View style={styles.skeletonAvatar} />
            <View style={styles.skeletonContent}>
                <View style={styles.skeletonLineShort} />
                <View style={styles.skeletonLineLong} />
            </View>
        </View>
    );
};

export const ChatScreen: React.FC<ChatScreenProps> = ({ conversation }) => {
    const router = useNexusRouter();
    const params = useSearchParams<{ name?: string; avatar?: string }>();
    const activeUser: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );
    const client = useApolloClient();
    const { width, height: windowHeight } = useWindowDimensions();
    const isLargeScreen = width > 768;

    // Create a ref for the FlatList scroll container.
    const flatListRef = useRef<FlatList>(null);

    // Determine if the conversation is one-to-one.
    const isOneToOne =
        conversation &&
        activeUser &&
        conversation.participantsUserIds.length === 2;

    // For one-to-one chats, determine the other participant's id.
    const otherUserId = isOneToOne
        ? conversation.participantsUserIds.find((id) => id !== activeUser.id) ||
          null
        : null;

    // For one-to-one, use FETCH_USER_QUERY.
    const { data: fetchedUserData, loading: fetchedUserLoading } = useQuery(
        FETCH_USER_QUERY,
        {
            variables: { userId: otherUserId },
            skip: !otherUserId,
        }
    );

    // For group conversations, fetch user info for all participants (excluding active user).
    const [groupUsers, setGroupUsers] = useState<UserType[]>([]);
    useEffect(() => {
        if (
            conversation &&
            activeUser &&
            conversation.participantsUserIds.length !== 2
        ) {
            const groupUserIds = conversation.participantsUserIds.filter(
                (id) => id !== activeUser.id
            );
            Promise.all(
                groupUserIds.map((id) =>
                    client.query({
                        query: FETCH_USER_QUERY,
                        variables: { userId: id },
                    })
                )
            )
                .then((results) => {
                    const usersData = results.map((res) => res.data.fetchUser);
                    setGroupUsers(usersData);
                })
                .catch((err) =>
                    console.error('Error fetching group users', err)
                );
        }
    }, [conversation, activeUser, client]);

    // Derive header information.
    let headerName: string | React.ReactNode;
    let headerContent: React.ReactNode;
    if (conversation && activeUser) {
        if (isOneToOne) {
            if (fetchedUserLoading) {
                // Render skeleton placeholders for both avatar and username.
                headerName = <View style={styles.skeletonHeaderText} />;
                headerContent = <View style={styles.skeletonHeaderAvatar} />;
            } else {
                // For one-to-one, show the other user's username and online status dot.
                const friendUsername = fetchedUserData?.fetchUser?.username;
                const friendStatus =
                    fetchedUserData?.fetchUser?.status || 'offline';
                headerName = friendUsername;
                headerContent = (
                    <View style={styles.avatarAndDot}>
                        <NexusImage
                            source={`https://picsum.photos/seed/${friendUsername || 'default'}/40`}
                            alt="avatar"
                            width={40}
                            height={40}
                            style={styles.headerAvatar}
                            contentFit="cover"
                        />
                        <View
                            style={[
                                styles.statusDot,
                                {
                                    backgroundColor:
                                        getOnlineStatusDotColor(friendStatus),
                                },
                            ]}
                        />
                    </View>
                );
            }
        } else {
            // For group conversations, list all participants' usernames (excluding active user).
            headerName =
                groupUsers.map((user) => user.username).join(', ') ||
                'Group Chat';
            headerContent = (
                <View style={styles.avatarGroup}>
                    {groupUsers.slice(0, 3).map((user, index) => (
                        <NexusImage
                            key={user.id}
                            source={`https://picsum.photos/seed/${user.username || 'default'}/40`}
                            alt="avatar"
                            width={40}
                            height={40}
                            style={[
                                styles.groupAvatar,
                                { marginLeft: index === 0 ? 0 : -10 },
                            ]}
                            contentFit="cover"
                        />
                    ))}
                </View>
            );
        }
    } else {
        headerName = params?.get('name') || 'Unknown';
        headerContent = (
            <NexusImage
                source={
                    params?.get('avatar') ??
                    `https://picsum.photos/seed/${params?.get('name') || 'default'}/40`
                }
                alt="avatar"
                width={40}
                height={40}
                style={styles.headerAvatar}
                contentFit="cover"
            />
        );
    }

    const headerHeight = 70;
    const inputHeight = 70;
    const messagesHeight = windowHeight - (headerHeight + inputHeight);

    // Use GET_CONVERSATION_MESSAGES to fetch messages.
    const LIMIT = 20;
    const {
        data,
        loading: messagesLoading,
        fetchMore,
    } = useQuery(GET_CONVERSATION_MESSAGES, {
        variables: {
            conversationId: conversation?.id || '',
            offset: 0,
            limit: LIMIT,
        },
        skip: !conversation?.id,
        fetchPolicy: 'network-only',
    });

    // Initialize messages state from query data.
    const [messages, setMessages] = useState<Message[]>([]);
    useEffect(() => {
        if (data && data.getConversationMessages) {
            setMessages(data.getConversationMessages);
        }
    }, [data]);

    // Mutation hook for sending messages.
    const [sendMessage] = useMutation(SEND_MESSAGE);

    // Callback to load more messages when scrolling.
    const handleLoadMore = useCallback(() => {
        if (fetchMore && !messagesLoading && conversation?.id) {
            fetchMore({
                variables: {
                    conversationId: conversation.id,
                    offset: messages.length,
                    limit: LIMIT,
                },
            })
                .then((fetchMoreResult) => {
                    const newMessages =
                        fetchMoreResult.data.getConversationMessages;
                    if (newMessages.length > 0) {
                        setMessages((prevMessages) => [
                            ...prevMessages,
                            ...newMessages,
                        ]);
                    }
                })
                .catch((err) => {
                    console.error('Error loading more messages:', err);
                });
        }
    }, [fetchMore, messages.length, messagesLoading, conversation]);

    // Callback to handle inline image press.
    const onInlineImagePress = (url: string) => {
        console.log('Inline image pressed:', url);
    };

    // Callback to handle attachment preview press.
    const onAttachmentPreviewPress = (url: string) => {
        console.log('Attachment preview pressed:', url);
    };

    // Updated handleSend now uses the SEND_MESSAGE mutation.
    const handleSend = (text: string, attachmentUrls: string[]) => {
        // Generate a temporary id for optimistic UI.
        const tempId = uuidv4();
        const newMessage: Message = {
            id: tempId,
            content: text,
            senderUserId: activeUser?.id ?? '',
            createdAt: new Date().toLocaleString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            }),
            edited: false,
            attachmentUrls,
        };

        // Optimistically update the UI.
        setMessages((prevMessages) => [newMessage, ...prevMessages]);

        sendMessage({
            variables: {
                conversationId: conversation?.id,
                id: tempId,
                content: text,
                senderUserId: activeUser?.id,
            },
            optimisticResponse: {
                sendMessage: {
                    id: tempId,
                    __typename: 'Message',
                },
            },
        }).catch((err) => {
            console.error('Error sending message:', err);
        });
    };

    // Helper function to compute sender's username.
    const getSenderName = (message: Message): string => {
        if (conversation && activeUser) {
            if (conversation.participantsUserIds.length === 2) {
                return message.senderUserId === activeUser.id
                    ? activeUser.username
                    : fetchedUserData?.fetchUser?.username ||
                          message.senderUserId;
            }
            if (message.senderUserId === activeUser.id) {
                return activeUser.username;
            }
            const senderInfo = groupUsers.find(
                (u) => u.id === message.senderUserId
            );
            return senderInfo ? senderInfo.username : message.senderUserId;
        }
        return message.senderUserId;
    };

    // Transform a Message into a type accepted by MessageItem.
    const transformMessage = (msg: Message): DirectMessageWithAvatar => ({
        id: msg.id,
        avatar: `https://picsum.photos/seed/${getSenderName(msg) || 'default'}/40`,
        username: getSenderName(msg),
        content: msg.content,
        attachmentUrls: msg.attachmentUrls ?? [],
        edited: msg.edited,
        senderUserId: msg.senderUserId,
        createdAt: msg.createdAt,
    });

    // Callback for when an attachment is pressed.
    const handleAttachmentPress = (attachmentUrls: string[], index: number) => {
        console.log('Attachment pressed:', attachmentUrls, index);
    };

    // Render each message using the MessageItem component.
    const renderItem = ({ item }: { item: Message }) => {
        const transformedMessage = transformMessage(item);
        return (
            <MessageItem
                message={transformedMessage}
                width={width}
                onAttachmentPress={handleAttachmentPress}
                scrollContainerRef={flatListRef} // Pass the FlatList ref to each MessageItem.
            />
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Chat Header */}
            <View style={styles.chatHeader}>
                {!isLargeScreen && (
                    <Icon.Button
                        name="arrow-left"
                        size={20}
                        backgroundColor={COLORS.SecondaryBackground}
                        onPress={() => router.back()}
                    />
                )}
                {headerContent}
                {typeof headerName === 'string' ? (
                    <Text style={styles.chatTitle}>{headerName}</Text>
                ) : (
                    headerName
                )}
            </View>

            {/* Main Content Area */}
            <View style={styles.mainContent}>
                <View
                    style={[
                        styles.messagesContainer,
                        { height: messagesHeight },
                    ]}
                >
                    {messagesLoading && messages.length === 0 ? (
                        Array.from({ length: 5 }).map((_, index) => (
                            <SkeletonMessageItem key={index} />
                        ))
                    ) : (
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            inverted
                            keyExtractor={(item) => item.id}
                            renderItem={renderItem}
                            onEndReached={handleLoadMore}
                            onEndReachedThreshold={0.1}
                        />
                    )}
                </View>
                <View style={styles.inputContainer}>
                    <ChatInputContainer
                        onSend={handleSend}
                        recipientName={
                            typeof headerName === 'string' ? headerName : 'Chat'
                        }
                        onInlineImagePress={onInlineImagePress}
                        onAttachmentPreviewPress={onAttachmentPreviewPress}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        height: '100vh',
        flex: 1,
        backgroundColor: COLORS.SecondaryBackground,
        overflow: 'hidden',
    },
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.SecondaryBackground,
        borderBottomWidth: 1,
        borderColor: COLORS.InactiveText,
        padding: 15,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarAndDot: {
        position: 'relative',
        marginRight: 10,
    },
    statusDot: {
        position: 'absolute',
        bottom: 0,
        right: 5,
        width: 15,
        height: 15,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: COLORS.SecondaryBackground,
    },
    avatarGroup: {
        flexDirection: 'row',
        marginRight: 10,
    },
    groupAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.SecondaryBackground,
    },
    chatTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.White,
        marginLeft: 10,
    },
    mainContent: {
        flex: 1,
        flexDirection: 'column',
    },
    messagesContainer: {
        flex: 1,
    },
    inputContainer: {
        height: 70,
    },
    skeletonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
        paddingHorizontal: 15,
    },
    skeletonAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.InactiveText,
    },
    skeletonContent: {
        flex: 1,
        marginLeft: 10,
    },
    skeletonLineShort: {
        width: '30%',
        height: 10,
        backgroundColor: COLORS.InactiveText,
        marginBottom: 6,
        borderRadius: 5,
    },
    skeletonLineLong: {
        width: '80%',
        height: 10,
        backgroundColor: COLORS.InactiveText,
        borderRadius: 5,
    },
    skeletonHeaderAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.InactiveText,
    },
    skeletonHeaderText: {
        width: 100,
        height: 20,
        backgroundColor: COLORS.InactiveText,
        borderRadius: 4,
        marginLeft: 10,
    },
});
