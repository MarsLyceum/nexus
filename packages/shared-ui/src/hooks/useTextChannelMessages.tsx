import { useState, useEffect, useRef } from 'react';
import { useApolloClient, useSubscription, useQuery } from '@apollo/client';
import {
    GET_TEXT_CHANNEL_MESSAGES_QUERY,
    FETCH_USER_QUERY,
    MESSAGE_ADDED_SUBSCRIPTION,
} from '../queries';
import { TextChannelMessage, User, MessageWithAvatar } from '../types';

export const useTextChannelMessages = (channelId: string) => {
    const apolloClient = useApolloClient();
    const [chatMessages, setChatMessages] = useState<MessageWithAvatar[]>([]);
    const [offset, setOffset] = useState(0);
    const limit = 20;
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const userCacheRef = useRef<Record<string, string>>({});

    // Helper function to fetch username using cache.
    const fetchUsername = async (userId: string): Promise<string> => {
        if (userCacheRef.current[userId]) {
            return userCacheRef.current[userId];
        }
        try {
            const fetchUserResult = await apolloClient.query<{
                fetchUser: User;
            }>({
                query: FETCH_USER_QUERY,
                variables: { userId },
            });
            const { username } = fetchUserResult.data.fetchUser;
            userCacheRef.current[userId] = username;
            return username;
        } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);
            return 'Unknown User';
        }
    };

    // Local state updater to add messages directly.
    const addMessage = (newMsg: MessageWithAvatar) => {
        setChatMessages((prev) => {
            // Merge new message and deduplicate by id.
            const messagesMap = new Map<string, MessageWithAvatar>();
            [newMsg, ...prev].forEach((msg) => messagesMap.set(msg.id, msg));
            const merged = [...messagesMap.values()];
            merged.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime());
            return merged;
        });
    };

    // Fetch messages (initial and paginated) with useQuery.
    const { data, loading } = useQuery<{
        getTextChannelMessages: TextChannelMessage[];
    }>(GET_TEXT_CHANNEL_MESSAGES_QUERY, {
        variables: { channelId, offset, refreshTrigger, limit },
    });

    useEffect(() => {
        if (loading) return;
        if (!data || !data.getTextChannelMessages) return;

        const messagesArray = data.getTextChannelMessages;
        if (!Array.isArray(messagesArray)) {
            console.error('Expected fetchChannelMessages to be an array.');
            return;
        }

        const processMessages = async () => {
            const newMessages: MessageWithAvatar[] = await Promise.all(
                messagesArray.map(async (msg: TextChannelMessage) => {
                    const username = await fetchUsername(msg.postedByUserId);
                    return {
                        ...msg,
                        postedAt: new Date(msg.postedAt),
                        username,
                        avatar: 'https://picsum.photos/50?random=10',
                    };
                })
            );

            newMessages.sort(
                (a, b) => b.postedAt.getTime() - a.postedAt.getTime()
            );

            if (offset === 0) {
                // Merge fetched messages with any existing ones.
                setChatMessages((prev) => {
                    const messagesMap = new Map<string, MessageWithAvatar>();
                    newMessages.forEach((msg) => messagesMap.set(msg.id, msg));
                    prev.forEach((msg) => {
                        if (!messagesMap.has(msg.id)) {
                            messagesMap.set(msg.id, msg);
                        }
                    });
                    const merged = [...messagesMap.values()];
                    merged.sort(
                        (a, b) => b.postedAt.getTime() - a.postedAt.getTime()
                    );
                    return merged;
                });
            } else {
                // For pagination, prepend older messages.
                setChatMessages((prev) => {
                    const merged = [...newMessages, ...prev];
                    merged.sort(
                        (a, b) => b.postedAt.getTime() - a.postedAt.getTime()
                    );
                    return merged;
                });
            }
            if (offset === 0) {
                setLoadingMessages(false);
            }
            setLoadingMore(false);
        };

        processMessages().catch((error) => {
            console.error('Error processing messages:', error);
            setLoadingMore(false);
        });
    }, [data, loading, offset, refreshTrigger, apolloClient]);

    // Subscribe for new messages on this channel.
    const { data: subscriptionData } = useSubscription(
        MESSAGE_ADDED_SUBSCRIPTION,
        { variables: { channelId } }
    );

    useEffect(() => {
        void (async () => {
            if (subscriptionData && subscriptionData.messageAdded) {
                const msg = subscriptionData.messageAdded;
                const username = await fetchUsername(msg.postedByUserId);
                const newMessage: MessageWithAvatar = {
                    ...msg,
                    postedAt: new Date(msg.postedAt),
                    username,
                    avatar: 'https://picsum.photos/50?random=10',
                };

                // Replace an existing optimistic message (if any) with the confirmed message.
                setChatMessages((prev) => {
                    const optimisticIndex = prev.findIndex(
                        (m) =>
                            m.content === newMessage.content &&
                            m.postedByUserId === newMessage.postedByUserId
                    );
                    if (optimisticIndex !== -1) {
                        const oldMessage = prev[optimisticIndex];
                        // Merge the confirmed message data into the optimistic message
                        const mergedMessage = { ...oldMessage, ...newMessage };
                        const updated = [...prev];
                        updated[optimisticIndex] = mergedMessage;
                        return updated;
                    }
                    return [newMessage, ...prev];
                });
            }
        })();
    }, [subscriptionData, apolloClient]);

    // Reset messages when channel changes.
    useEffect(() => {
        setChatMessages([]);
        setOffset(0);
        setLoadingMessages(true);
    }, [channelId]);

    const loadMoreMessages = () => {
        if (loadingMore) return;
        setLoadingMore(true);
        setOffset((prev) => prev + limit);
    };

    const refreshMessages = () => {
        setOffset(0);
        setRefreshTrigger((prev) => prev + 1);
    };

    const deleteMessage = (message: MessageWithAvatar) => {
        setChatMessages((prevMessages) =>
            prevMessages.filter((msg) => msg.id !== message.id)
        );
    };

    return {
        chatMessages,
        loadingMessages,
        loadingMore,
        loadMoreMessages,
        refreshMessages,
        addMessage,
        deleteMessage,
    };
};
