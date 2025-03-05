import { useState, useEffect, useRef } from 'react';
import { useApolloClient, useSubscription } from '@apollo/client';
import {
    FETCH_CHANNEL_MESSAGES_QUERY,
    FETCH_USER_QUERY,
    MESSAGE_ADDED_SUBSCRIPTION,
} from '../queries';
import { GroupChannelMessage, User, MessageWithAvatar } from '../types';

export const useChannelMessages = (channelId: string) => {
    const apolloClient = useApolloClient();
    const [chatMessages, setChatMessages] = useState<MessageWithAvatar[]>([]);
    const [offset, setOffset] = useState(0);
    const limit = 100;
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const userCacheRef = useRef<Record<string, string>>({});

    // Fetch the initial (and paginated) messages
    useEffect(() => {
        let cancelled = false;
        const fetchMessages = async () => {
            try {
                const { data } = await apolloClient.query<{
                    fetchChannelMessages: GroupChannelMessage[];
                }>({
                    query: FETCH_CHANNEL_MESSAGES_QUERY,
                    variables: { channelId, offset },
                });

                const messagesArray = data.fetchChannelMessages;
                if (!Array.isArray(messagesArray)) {
                    console.error(
                        'Expected fetchChannelMessages to be an array.'
                    );
                    return;
                }

                // Map and convert timestamps, and fetch usernames if needed.
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

                // Sort messages in descending order (newest first).
                newMessages.sort(
                    (a, b) => b.postedAt.getTime() - a.postedAt.getTime()
                );

                if (!cancelled) {
                    if (offset === 0) {
                        // Merge the fetched messages with any existing ones, deduplicating by id.
                        setChatMessages((prev) => {
                            const messagesMap = new Map<
                                string,
                                MessageWithAvatar
                            >();
                            // Insert fetched messages first.
                            newMessages.forEach((msg) =>
                                messagesMap.set(msg.id, msg)
                            );
                            // Add any existing messages that are not in the new fetch.
                            prev.forEach((msg) => {
                                if (!messagesMap.has(msg.id)) {
                                    messagesMap.set(msg.id, msg);
                                }
                            });
                            const merged = Array.from(messagesMap.values());
                            // Ensure merged messages remain sorted in descending order.
                            merged.sort(
                                (a, b) =>
                                    b.postedAt.getTime() - a.postedAt.getTime()
                            );
                            return merged;
                        });
                    } else {
                        // For pagination (loading older messages), prepend them.
                        setChatMessages((prev) => {
                            const merged = [...newMessages, ...prev];
                            merged.sort(
                                (a, b) =>
                                    b.postedAt.getTime() - a.postedAt.getTime()
                            );
                            return merged;
                        });
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
    }, [channelId, offset, refreshTrigger, apolloClient]);

    // Subscribe for new messages on this channel
    const { data: subscriptionData } = useSubscription(
        MESSAGE_ADDED_SUBSCRIPTION,
        {
            variables: { channelId },
        }
    );

    useEffect(() => {
        if (subscriptionData && subscriptionData.messageAdded) {
            const msg = subscriptionData.messageAdded;
            const newMessage: MessageWithAvatar = {
                ...msg,
                postedAt: new Date(msg.postedAt),
                username:
                    userCacheRef.current[msg.postedByUserId] || 'Unknown User',
                avatar: 'https://picsum.photos/50?random=10',
            };
            // Insert at index 0 so that in the descending array,
            // the newest message (at index 0) appears at the bottom when rendered via an inverted FlatList.
            setChatMessages((prev) => [newMessage, ...prev]);
        }
    }, [subscriptionData]);

    const loadMoreMessages = () => {
        if (loadingMore) return;
        setLoadingMore(true);
        setOffset((prev) => prev + limit);
    };

    const refreshMessages = () => {
        setOffset(0);
        setRefreshTrigger((prev) => prev + 1);
    };

    return {
        chatMessages,
        loadingMessages,
        loadingMore,
        loadMoreMessages,
        refreshMessages,
    };
};
