// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable max-lines */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    useWindowDimensions,
    SafeAreaView,
    FlatList,
    Platform,
} from 'react-native';
import { useQuery, useApolloClient, useMutation } from '@apollo/client';
import { v4 as uuidv4 } from 'uuid';

import { useNexusRouter, createNexusParam } from '../hooks';
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
    UPDATE_MESSAGE,
    GET_CONVERSATION_MESSAGES,
    DELETE_MESSAGE,
} from '../queries';
import {
    Message,
    Conversation,
    DirectMessageWithAvatar,
    MessageWithAvatar,
    Attachment,
} from '../types';
import { getOnlineStatusDotColor } from '../utils';
import { BackArrow } from '../buttons';

interface ChatScreenProps {
    conversation?: Conversation;
}

const { useParams } = createNexusParam();

// Skeleton screen component to show loading placeholders.
const SkeletonMessageItem: React.FC = () => (
    // @ts-expect-error web only types
    <View style={styles.skeletonContainer}>
        {/* @ts-expect-error web only types */}
        <View style={styles.skeletonAvatar} />
        {/* @ts-expect-error web only types */}
        <View style={styles.skeletonContent}>
            {/* @ts-expect-error web only types */}
            <View style={styles.skeletonLineShort} />
            {/* @ts-expect-error web only types */}
            <View style={styles.skeletonLineLong} />
        </View>
    </View>
);

export const ChatScreen: React.FC<ChatScreenProps> = ({ conversation }) => {
    const router = useNexusRouter();
    const { params } = useParams();
    const activeUser: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );
    const client = useApolloClient();
    const { width, height: windowHeight } = useWindowDimensions();
    const isLargeScreen = width > 768;
    const [inputContainerHeight, setInputContainerHeight] =
        useState<number>(70);

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
          undefined
        : undefined;

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
                // eslint-disable-next-line promise/always-return
                .then((results) => {
                    const usersData = results.map((res) => res.data.fetchUser);
                    setGroupUsers(usersData);
                })
                .catch((error) =>
                    console.error('Error fetching group users', error)
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
                // @ts-expect-error web only types
                headerName = <View style={styles.skeletonHeaderText} />;
                // @ts-expect-error web only types
                headerContent = <View style={styles.skeletonHeaderAvatar} />;
            } else {
                // For one-to-one, show the other user's username and online status dot.
                const friendUsername = fetchedUserData?.fetchUser?.username;
                const friendStatus =
                    fetchedUserData?.fetchUser?.status || 'offline';
                headerName = friendUsername;
                headerContent = (
                    // @ts-expect-error web only types
                    <View style={styles.avatarAndDot}>
                        <NexusImage
                            source={`https://picsum.photos/seed/${friendUsername || 'default'}/40`}
                            alt="avatar"
                            width={40}
                            height={40}
                            // @ts-expect-error web only types
                            style={styles.headerAvatar}
                            contentFit="cover"
                        />
                        <View
                            style={[
                                // @ts-expect-error web only types
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
            headerName = groupUsers.map((user) => user?.username).join(', ');
            headerContent = (
                // @ts-expect-error web only types
                <View style={styles.avatarGroup}>
                    {groupUsers.slice(0, 3).map((user, index) => (
                        <NexusImage
                            key={user?.id}
                            source={`https://picsum.photos/seed/${user?.username || 'default'}/40`}
                            alt="avatar"
                            width={40}
                            height={40}
                            // @ts-expect-error web only types
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
                // @ts-expect-error web only types
                style={styles.headerAvatar}
                contentFit="cover"
            />
        );
    }

    const headerHeight = 70;
    const messagesHeight = windowHeight - (headerHeight + inputContainerHeight);

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
    const [updateMessage] = useMutation(UPDATE_MESSAGE);
    const [deleteMessage] = useMutation(DELETE_MESSAGE);

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
                    // eslint-disable-next-line promise/always-return
                    if (newMessages.length > 0) {
                        setMessages((prevMessages) => [
                            ...prevMessages,
                            ...newMessages,
                        ]);
                    }
                })
                .catch((error) => {
                    console.error('Error loading more messages:', error);
                });
        }
    }, [fetchMore, messages.length, messagesLoading, conversation]);

    // Callback to handle inline image press.
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const onInlineImagePress = (url: string) => {
        console.log('Inline image pressed:', url);
    };

    // Callback to handle attachment preview press.
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const onAttachmentPreviewPress = (attachment: Attachment) => {
        console.log('Attachment preview pressed:', attachment);
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
        }).catch((error) => {
            console.error('Error sending message:', error);
        });
    };

    // Helper function to compute sender's username.
    const getSenderName = (message: Message): string => {
        if (conversation && activeUser) {
            if (conversation.participantsUserIds.length === 2) {
                return message.senderUserId === activeUser.id
                    ? activeUser.username
                    : fetchedUserData?.fetchUser?.username;
            }
            if (message.senderUserId === activeUser.id) {
                return activeUser.username;
            }
            const senderInfo = groupUsers.find(
                (u) => u?.id === message.senderUserId
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
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const handleAttachmentPress = (attachmentUrls: string[], index: number) => {
        console.log('Attachment pressed:', attachmentUrls, index);
    };

    const handleSaveEdit = useCallback(
        (message: DirectMessageWithAvatar | MessageWithAvatar) => {
            updateMessage({
                variables: {
                    conversationId: conversation?.id,
                    id: message.id,
                    content: message.content,
                    senderUserId: activeUser?.id,
                },
                optimisticResponse: {
                    updateMessage: {
                        id: message.id,
                        content: message.content,
                        __typename: 'Message',
                    },
                },
            }).catch((error) => {
                console.error('Error updating message:', error);
            });
        },
        [activeUser?.id, conversation?.id, updateMessage]
    );

    const handleDeleteMessage = useCallback(
        (message: DirectMessageWithAvatar | MessageWithAvatar) => {
            // Optimistically update the UI by removing the message from the local state.
            setMessages((prevMessages) =>
                prevMessages.filter((msg) => msg.id !== message.id)
            );

            deleteMessage({
                variables: {
                    messageId: message.id,
                },
                optimisticResponse: {
                    updateMessage: true,
                },
            }).catch((error) => {
                console.error('Error deleting message:', error);
            });
        },
        [deleteMessage]
    );

    // Render each message using the MessageItem component.
    const renderItem = ({ item }: { item: Message }) => {
        const transformedMessage = transformMessage(item);
        return (
            <MessageItem
                message={transformedMessage}
                width={width}
                onAttachmentPress={handleAttachmentPress}
                scrollContainerRef={flatListRef} // Pass the FlatList ref to each MessageItem.
                onSaveEdit={handleSaveEdit}
                onDeleteMessage={handleDeleteMessage}
            />
        );
    };

    return (
        // @ts-expect-error web only types
        <SafeAreaView style={styles.container}>
            {/* Chat Header */}
            {/* @ts-expect-error web only types */}
            <View style={styles.chatHeader}>
                {!isLargeScreen && (
                    <BackArrow
                        onPress={() => router.goBack()}
                        // @ts-expect-error web styles
                        style={styles.backArrow}
                    />
                )}
                {headerContent}
                {typeof headerName === 'string' ? (
                    // @ts-expect-error web only types
                    <Text style={styles.chatTitle}>{headerName}</Text>
                ) : (
                    headerName
                )}
            </View>
            {/* Main Content Area */}
            {/* @ts-expect-error web only types */}
            <View style={styles.mainContent}>
                <View
                    style={[
                        // @ts-expect-error web only types
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
                <View
                    // @ts-expect-error web only types
                    style={styles.inputContainer}
                    onLayout={(e) => {
                        const { height } = e.nativeEvent.layout;
                        // Update only if changed to avoid unnecessary re-renders
                        if (height !== inputContainerHeight) {
                            setInputContainerHeight(height);
                        }
                    }}
                >
                    <ChatInputContainer
                        // @ts-expect-error web only types
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
        flex: 1,
        flexBasis: 0,
        backgroundColor: COLORS.SecondaryBackground,
        overflow: 'hidden',
        // @ts-expect-error web only
        height: '100%',
        ...(Platform.OS === 'web' && { height: '100vh' }),
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
        minHeight: 70,
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
    backArrow: {
        marginRight: 10,
    },
});
