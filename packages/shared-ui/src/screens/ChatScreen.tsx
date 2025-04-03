import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    useWindowDimensions,
    SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useSearchParams } from 'solito/navigation';
import { useQuery, useApolloClient } from '@apollo/client';

import { useNexusRouter } from '../hooks';
import { COLORS } from '../constants';
import {
    ChatInputContainer,
    NexusList,
    NexusImage,
    MessageItem,
} from '../small-components';
import { useAppSelector, RootState, UserType } from '../redux';
import { FETCH_USER_QUERY } from '../queries';
import { Attachment, MessageWithAvatar } from '../types';
import { getOnlineStatusDotColor } from '../utils';

// Updated Message type based on the GraphQL response, now including optional attachments.
export type Message = {
    id: string;
    content: string;
    senderUserId: string;
    createdAt: string;
    edited: boolean;
    attachments?: Attachment[];
};

// Conversation type coming from the GraphQL query.
export type Conversation = {
    id: string;
    type: string;
    participantsUserIds: string[];
    messages: Message[];
    channelId: string;
};

interface ChatScreenProps {
    conversation?: Conversation;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ conversation }) => {
    const router = useNexusRouter();
    const params = useSearchParams<{ name?: string; avatar?: string }>();
    const activeUser: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );
    const client = useApolloClient();
    const { width, height: windowHeight } = useWindowDimensions();
    const isLargeScreen = width > 768;

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
    let headerName: string;
    let headerContent: React.ReactNode;
    if (conversation && activeUser) {
        if (isOneToOne) {
            // For one-to-one, show the other user's username and online status dot.
            const friendUsername =
                !fetchedUserLoading &&
                fetchedUserData &&
                fetchedUserData.fetchUser
                    ? fetchedUserData.fetchUser.username
                    : otherUserId || 'Chat';
            const friendStatus =
                !fetchedUserLoading &&
                fetchedUserData &&
                fetchedUserData.fetchUser
                    ? fetchedUserData.fetchUser.status
                    : 'offline';
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

    // Initialize messages state from conversation if available.
    const initialMessages: Message[] = conversation
        ? conversation.messages
        : [];
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    useEffect(() => {
        if (conversation) {
            setMessages(conversation.messages);
        }
    }, [conversation]);

    // Callback to handle inline image press.
    const onInlineImagePress = (url: string) => {
        console.log('Inline image pressed:', url);
    };

    // Callback to handle attachment preview press.
    const onAttachmentPreviewPress = (att: Attachment) => {
        console.log('Attachment preview pressed:', att);
    };

    // Updated handleSend now accepts attachments.
    const handleSend = (text: string, attachments: Attachment[]) => {
        const newMessage: Message = {
            id: Math.random().toString(),
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
            attachments,
        };
        setMessages((prevMessages) => [...prevMessages, newMessage]);
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

    // Transform Message to MessageWithAvatar for MessageItem.
    const transformMessage = (msg: Message): MessageWithAvatar => ({
        id: msg.id,
        avatar: `https://picsum.photos/seed/${getSenderName(msg) || 'default'}/40`,
        username: getSenderName(msg),
        postedAt: new Date(msg.createdAt),
        content: msg.content,
        attachmentUrls: msg.attachments
            ? msg.attachments.map((att) => att.previewUri)
            : [],
        previewData: [], // You can add preview data if available.
        edited: msg.edited,
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
                item={transformedMessage}
                width={width}
                onAttachmentPress={handleAttachmentPress}
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
                <Text style={styles.chatTitle}>{headerName}</Text>
            </View>

            {/* Main Content Area */}
            <View style={styles.mainContent}>
                <View
                    style={[
                        styles.messagesContainer,
                        { height: messagesHeight },
                    ]}
                >
                    <NexusList
                        data={messages}
                        inverted={false}
                        estimatedItemSize={80}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                    />
                </View>
                <View style={styles.inputContainer}>
                    <ChatInputContainer
                        onSend={handleSend}
                        recipientName={headerName}
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
});
