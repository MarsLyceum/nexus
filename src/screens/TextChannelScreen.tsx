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
import { NavigationProp } from '@react-navigation/core';
import { useApolloClient } from '@apollo/client';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useAppSelector, RootState, UserType } from '../redux';
import {
    Header,
    AttachmentPreviews,
    Attachment,
    LargeImageModal,
} from '../sections';
import {
    FETCH_CHANNEL_MESSAGES_QUERY,
    FETCH_USER_QUERY,
    CREATE_GROUP_CHANNEL_MESSAGE_MUTATION,
} from '../queries';
import { COLORS } from '../constants';
import { GroupChannel, GroupChannelMessage, User } from '../types';
import { useFileUpload } from '../hooks/useFileUpload';

export type MessageWithAvatar = GroupChannelMessage & {
    avatar: string;
    username: string;
    attachmentUrls?: string[];
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

type TextChannelScreenProps = {
    channel: GroupChannel;
    navigation: NavigationProp<Record<string, unknown>>;
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
    const [loadingMessages, setLoadingMessages] = useState<boolean>(true);
    const userCacheRef = useRef<Record<string, string>>({});
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;
    const flatListRef = useRef<FlatList<MessageWithAvatar> | null>(null);

    const { pickFile } = useFileUpload();
    const [attachments, setAttachments] = useState<Attachment[]>([]);

    // New states for the updated modal usage
    const [modalVisible, setModalVisible] = useState(false);
    const [modalAttachments, setModalAttachments] = useState<string[]>([]);
    const [modalInitialIndex, setModalInitialIndex] = useState(0);

    const isImageUrl = (url: string): boolean => {
        return /\.(jpeg|jpg|gif|png)$/i.test(url);
    };

    const inlineImageUrl = (() => {
        const trimmed = messageText.trim();
        if (
            trimmed.startsWith('http') &&
            !trimmed.includes(' ') &&
            isImageUrl(trimmed)
        ) {
            return trimmed;
        }
        return null;
    })();

    const renderMessageContent = (content: string) => {
        const isOnlyUrl = content.startsWith('http') && !content.includes(' ');
        if (isOnlyUrl && isImageUrl(content)) {
            return (
                <TouchableOpacity
                    onPress={() => {
                        // Wrap the URL in an array and open modal at index 0
                        setModalAttachments([content]);
                        setModalInitialIndex(0);
                        setModalVisible(true);
                    }}
                >
                    <Image
                        source={{ uri: content }}
                        style={styles.messageAttachmentImage}
                    />
                </TouchableOpacity>
            );
        } else {
            return <Text style={styles.messageText}>{content}</Text>;
        }
    };

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
        if (!messageText.trim() && attachments.length === 0) return;
        try {
            const cappedAttachments = attachments.slice(0, 10);
            const attachmentsArray = cappedAttachments.map((att) => att.file);

            console.log('variables:', {
                postedByUserId: user?.id,
                channelId: channel.id,
                content: messageText.trim(),
                attachments: attachmentsArray,
            });

            await apolloClient.mutate({
                mutation: CREATE_GROUP_CHANNEL_MESSAGE_MUTATION,
                variables: {
                    postedByUserId: user?.id,
                    channelId: channel.id,
                    content: messageText.trim(),
                    attachments: attachmentsArray,
                },
                context: {
                    headers: {
                        'x-apollo-operation-name': 'CreateMessage',
                    },
                },
            });
            setMessageText('');
            setAttachments([]);
            Keyboard.dismiss();
            setOffset(0);
            setRefreshTrigger((prev) => prev + 1);
        } catch (error) {
            console.error('Error creating message:', error);
        }
    };

    const handleImageUpload = async () => {
        const file = await pickFile();
        if (file) {
            let previewUri = '';
            if ('uri' in file) {
                previewUri = file.uri;
            } else {
                previewUri = URL.createObjectURL(file);
            }
            const newAttachment: Attachment = {
                id: `${Date.now()}-${Math.random()}`,
                file,
                previewUri,
            };
            setAttachments((prev) => [...prev, newAttachment]);
        }
    };

    return (
        <View style={styles.chatContainer}>
            <Header
                isLargeScreen={isLargeScreen}
                headerText={channel.name}
                navigation={navigation}
            />

            {loadingMessages ? (
                <FlatList
                    data={[0, 1, 2, 3, 4]}
                    keyExtractor={(item) => item.toString()}
                    renderItem={() => <SkeletonMessageItem />}
                    contentContainerStyle={{ paddingBottom: 80 }}
                />
            ) : (
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
                                {item.content
                                    ? renderMessageContent(item.content)
                                    : null}
                                {item.attachmentUrls &&
                                    item.attachmentUrls.length > 0 && (
                                        <View
                                            style={
                                                styles.messageAttachmentsContainer
                                            }
                                        >
                                            {item.attachmentUrls.map(
                                                (url, index) => (
                                                    <TouchableOpacity
                                                        key={index}
                                                        onPress={() => {
                                                            // Pass the full array and set the tapped image as the initial index
                                                            setModalAttachments(
                                                                item.attachmentUrls!
                                                            );
                                                            setModalInitialIndex(
                                                                index
                                                            );
                                                            setModalVisible(
                                                                true
                                                            );
                                                        }}
                                                    >
                                                        <Image
                                                            source={{
                                                                uri: url,
                                                            }}
                                                            style={
                                                                styles.messageAttachmentImage
                                                            }
                                                        />
                                                    </TouchableOpacity>
                                                )
                                            )}
                                        </View>
                                    )}
                            </View>
                        </View>
                    )}
                />
            )}

            <View>
                <View style={styles.inputBorderLine} />
                {inlineImageUrl && (
                    <View style={styles.inlineAttachmentContainer}>
                        <View style={styles.attachmentPreview}>
                            <TouchableOpacity
                                onPress={() => {
                                    // Open modal with the inline image as a single-item array
                                    setModalAttachments([inlineImageUrl]);
                                    setModalInitialIndex(0);
                                    setModalVisible(true);
                                }}
                            >
                                <Image
                                    source={{ uri: inlineImageUrl }}
                                    style={styles.attachmentImage}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.removeAttachmentButton}
                                onPress={() => setMessageText('')}
                            >
                                <Icon
                                    name="times"
                                    size={18}
                                    color={COLORS.White}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <AttachmentPreviews
                    attachments={attachments}
                    onAttachmentPress={(att) => {
                        // Open modal with a single image preview from attachments
                        setModalAttachments([att.previewUri]);
                        setModalInitialIndex(0);
                        setModalVisible(true);
                    }}
                    onRemoveAttachment={(id) =>
                        setAttachments((prev) =>
                            prev.filter((a) => a.id !== id)
                        )
                    }
                />

                <View style={styles.inputContainerNoBorder}>
                    <TouchableOpacity
                        onPress={handleImageUpload}
                        style={styles.imageButton}
                    >
                        <Icon name="image" size={24} color="white" />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.input}
                        placeholder={`Message ${channel.name}`}
                        placeholderTextColor="gray"
                        value={messageText}
                        onChangeText={setMessageText}
                        onSubmitEditing={sendMessage}
                        returnKeyType="send"
                    />
                    {(messageText.length > 0 || attachments.length > 0) &&
                        Platform.OS !== 'web' && (
                            <TouchableOpacity
                                onPress={sendMessage}
                                style={styles.sendButton}
                            >
                                <Icon
                                    name="paper-plane"
                                    size={18}
                                    color="white"
                                />
                            </TouchableOpacity>
                        )}
                </View>
            </View>

            <LargeImageModal
                visible={modalVisible}
                attachments={modalAttachments}
                initialIndex={modalInitialIndex}
                onClose={() => setModalVisible(false)}
            />
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
        width: '100%',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    messageContent: {
        flex: 1,
        flexShrink: 1,
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
        flexWrap: 'wrap',
        flexShrink: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#4A3A5A',
        backgroundColor: COLORS.SecondaryBackground,
    },
    inputContainerNoBorder: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: COLORS.SecondaryBackground,
    },
    imageButton: {
        marginRight: 10,
        padding: 8,
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
    inputBorderLine: {
        height: 1,
        backgroundColor: '#4A3A5A',
        width: '100%',
    },
    inlineAttachmentContainer: {
        paddingVertical: 10,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    attachmentPreview: {
        position: 'relative',
        marginRight: 10,
    },
    attachmentImage: {
        width: 80,
        height: 80,
        borderRadius: 10,
    },
    removeAttachmentButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: COLORS.AppBackground,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    skeletonMessageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 15,
        width: '100%',
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
    messageAttachmentsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 5,
    },
    messageAttachmentImage: {
        width: 100,
        height: 100,
        marginRight: 5,
        marginTop: 5,
        borderRadius: 8,
    },
});
