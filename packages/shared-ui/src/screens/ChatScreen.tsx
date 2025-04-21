// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable max-lines */
import React, {
    useState,
    useEffect,
    useCallback,
    useRef,
    useMemo,
} from 'react';
import {
    View,
    Text,
    StyleSheet,
    useWindowDimensions,
    SafeAreaView,
    FlatList,
    Platform,
} from 'react-native';
import {
    useQuery,
    useApolloClient,
    useMutation,
    useSubscription,
} from '@apollo/client';
import { v4 as uuidv4 } from 'uuid';

import {
    useNexusRouter,
    createNexusParam,
    useImageDetailsModal,
} from '../hooks';
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
    DM_ADDED,
    GET_CONVERSATIONS,
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
import { ImageDetailsModal } from '../sections';
import { useTheme, Theme } from '../theme';

interface ChatScreenProps {
    conversation?: Conversation;
}

const { useParams } = createNexusParam();

export const ChatScreen: React.FC<ChatScreenProps> = ({ conversation }) => {
    const router = useNexusRouter();
    const { params } = useParams();
    const [conversationState, setConversationState] = useState<
        Conversation | undefined
    >(conversation);
    const {
        modalVisible,
        modalAttachments,
        modalInitialIndex,
        closeImagePreview,
        handleInlineImagePress,
        handleAttachmentPreviewPress,
        handleMessageItemAttachmentPress,
    } = useImageDetailsModal();
    const activeUser: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );
    const client = useApolloClient();
    const { width, height: windowHeight } = useWindowDimensions();
    const isLargeScreen = width > 768;
    const [inputContainerHeight, setInputContainerHeight] =
        useState<number>(70);
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    // Skeleton screen component to show loading placeholders.
    const SkeletonMessageItem: React.FC = () => (
        <View style={styles.skeletonContainer}>
            <View style={styles.skeletonAvatar} />
            <View style={styles.skeletonContent}>
                <View style={styles.skeletonLineShort} />
                <View style={styles.skeletonLineLong} />
            </View>
        </View>
    );

    const { conversationId: conversationIdParam } = params;

    useEffect(() => {
        setConversationState(conversation);
    }, [conversation]);

    // Create a ref for the FlatList scroll container.
    const flatListRef = useRef<FlatList>(null);

    // Determine if the conversation is one-to-one.
    const isOneToOne =
        conversationState &&
        activeUser &&
        conversationState.participantsUserIds.length === 2;

    // For one-to-one chats, determine the other participant's id.
    const otherUserId = isOneToOne
        ? conversationState.participantsUserIds.find(
              (id) => id !== activeUser.id
          ) || undefined
        : undefined;

    const { data: getConversationsData, loading: getConversationsLoading } =
        useQuery(GET_CONVERSATIONS, {
            variables: { userId: activeUser?.id },
            skip: Boolean(conversation),
        });

    useEffect(() => {
        if (getConversationsData) {
            setConversationState(
                getConversationsData.getConversations.find(
                    (c: Conversation) => c.id === conversationIdParam
                )
            );
        }
    }, [getConversationsData, conversationIdParam]);

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
            conversationState &&
            activeUser &&
            conversationState.participantsUserIds.length !== 2
        ) {
            const groupUserIds = conversationState.participantsUserIds.filter(
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
    }, [conversationState, activeUser, client]);

    // Derive header information.
    let headerName: string | React.ReactNode;
    let headerContent: React.ReactNode;
    if (conversationState && activeUser) {
        if (isOneToOne) {
            if (getConversationsLoading || fetchedUserLoading) {
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
                                    backgroundColor: getOnlineStatusDotColor(
                                        theme,
                                        friendStatus
                                    ),
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
            conversationId: conversationState?.id || '',
            offset: 0,
            limit: LIMIT,
        },
        skip: !conversationState?.id,
    });

    useSubscription(DM_ADDED, {
        variables: { conversationId: conversationState?.id || '' },
        onSubscriptionData: ({ subscriptionData }) => {
            const newMsg: Message | undefined = subscriptionData.data?.dmAdded;
            if (newMsg) {
                setMessages((prev) => {
                    // dedupe by id
                    if (prev.some((m) => m.id === newMsg.id)) return prev;
                    return [newMsg, ...prev];
                });
            }
        },
    });

    // Initialize messages state from query data.
    const [messages, setMessages] = useState<Message[]>([]);
    useEffect(() => {
        if (data && data.getConversationMessages) {
            setMessages(data.getConversationMessages);
        }
    }, [data]);

    // Mutation hook for sending messages.
    const [sendMessage] = useMutation(SEND_MESSAGE, {
        context: {
            headers: {
                'x-apollo-operation-name': 'SendMessage',
            },
        },
    });
    const [updateMessage] = useMutation(UPDATE_MESSAGE);
    const [deleteMessage] = useMutation(DELETE_MESSAGE);

    // Callback to load more messages when scrolling.
    const handleLoadMore = useCallback(() => {
        if (fetchMore && !messagesLoading && conversationState?.id) {
            fetchMore({
                variables: {
                    conversationId: conversationState.id,
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
    }, [fetchMore, messages.length, messagesLoading, conversationState]);

    // Updated handleSend now uses the SEND_MESSAGE mutation.
    const handleSend = (text: string, attachments: Attachment[]) => {
        const id = uuidv4();
        const newMessage: Message = {
            id,
            content: text,
            senderUserId: activeUser?.id ?? '',
            createdAt: new Date().toISOString(),
            edited: false,
        };

        // Optimistically update the UI.
        setMessages((prevMessages) => [
            {
                ...newMessage,
                attachmentUrls: attachments.map((att) => att.previewUri),
            },
            ...prevMessages,
        ]);

        sendMessage({
            variables: {
                conversationId: conversationState?.id,
                id,
                content: text,
                senderUserId: activeUser?.id,
                attachments: attachments.map((att) => att.file),
            },
            optimisticResponse: {
                sendMessage: {
                    id,
                    __typename: 'Message',
                },
            },
        }).catch((error) => {
            console.error('Error sending message:', error);
        });
    };

    // Helper function to compute sender's username.
    const getSenderName = (message: Message): string => {
        if (conversationState && activeUser) {
            if (conversationState.participantsUserIds.length === 2) {
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

    const handleSaveEdit = useCallback(
        (message: DirectMessageWithAvatar | MessageWithAvatar) => {
            updateMessage({
                variables: {
                    conversationId: conversationState?.id,
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
        [activeUser?.id, conversationState?.id, updateMessage]
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
                onAttachmentPress={handleMessageItemAttachmentPress}
                scrollContainerRef={flatListRef} // Pass the FlatList ref to each MessageItem.
                onSaveEdit={handleSaveEdit}
                onDeleteMessage={handleDeleteMessage}
            />
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Chat Header */}
            <View style={styles.chatHeader}>
                {!isLargeScreen && (
                    <BackArrow
                        onPress={() => router.goBack()}
                        style={styles.backArrow}
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
                <View
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
                        onSend={handleSend}
                        recipientName={
                            typeof headerName === 'string' ? headerName : 'Chat'
                        }
                        onInlineImagePress={handleInlineImagePress}
                        onAttachmentPreviewPress={handleAttachmentPreviewPress}
                    />

                    <ImageDetailsModal
                        visible={modalVisible}
                        attachments={modalAttachments}
                        initialIndex={modalInitialIndex}
                        onClose={closeImagePreview}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flex: 1,
            flexBasis: 0,
            backgroundColor: theme.colors.SecondaryBackground,
            overflow: 'hidden',
            height: '100%',
            ...(Platform.OS === 'web' && { height: '100vh' }),
        },
        chatHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.SecondaryBackground,
            borderBottomWidth: 1,
            borderColor: theme.colors.InactiveText,
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
            borderColor: theme.colors.SecondaryBackground,
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
            borderColor: theme.colors.SecondaryBackground,
        },
        chatTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.ActiveText,
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
            backgroundColor: theme.colors.InactiveText,
        },
        skeletonContent: {
            flex: 1,
            marginLeft: 10,
        },
        skeletonLineShort: {
            width: '30%',
            height: 10,
            backgroundColor: theme.colors.InactiveText,
            marginBottom: 6,
            borderRadius: 5,
        },
        skeletonLineLong: {
            width: '80%',
            height: 10,
            backgroundColor: theme.colors.InactiveText,
            borderRadius: 5,
        },
        skeletonHeaderAvatar: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.InactiveText,
        },
        skeletonHeaderText: {
            width: 100,
            height: 20,
            backgroundColor: theme.colors.InactiveText,
            borderRadius: 4,
            marginLeft: 10,
        },
        backArrow: {
            marginRight: 10,
        },
    });
}
