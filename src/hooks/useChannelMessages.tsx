import { useState, useEffect, useRef } from 'react';
import { useApolloClient } from '@apollo/client';
import { FETCH_CHANNEL_MESSAGES_QUERY, FETCH_USER_QUERY } from '../queries';
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
    }, [channelId, offset, refreshTrigger, apolloClient]);

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
