import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    useWindowDimensions,
    FlatList,
} from 'react-native';
import { useQuery, useApolloClient, useMutation } from '@apollo/client';

import { useTheme, Theme } from '../theme';
import { useNexusRouter, createNexusParam } from '../hooks';
import { ChatScreen } from './ChatScreen';
import {
    GET_CONVERSATIONS,
    CREATE_CONVERSATION,
    CLOSE_CONVERSATION,
} from '../queries';
import { useAppSelector, RootState, UserType } from '../redux';
import { Conversation } from '../types';
import { ConversationItem, ConversationSkeleton } from '../small-components';

// A component for rendering a single conversation item.

const { useParams } = createNexusParam();

export const DMListScreen: React.FC = () => {
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;
    const router = useNexusRouter();
    const apolloClient = useApolloClient();
    const { params } = useParams();
    const { friendId } = params;
    const [currentFriendId, setCurrentFriendId] = useState<string | undefined>(
        friendId
    );

    const [closeConversation] = useMutation(CLOSE_CONVERSATION);
    const [closedConversationIds, setClosedConversationIds] = useState<
        string[]
    >([]);
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    // Get the active user from Redux.
    const user: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );

    useEffect(() => {
        if (friendId) {
            setCurrentFriendId(friendId);
        }
    }, [friendId]);

    useEffect(() => {
        void (async () => {
            if (currentFriendId && user?.id) {
                const newConversationResult = await apolloClient.mutate({
                    mutation: CREATE_CONVERSATION,
                    variables: {
                        type: 'direct',
                        participantsUserIds: [currentFriendId, user?.id],
                        requestedByUserId: user?.id,
                    },
                    update: (cache, { data: { createConversation } }) => {
                        if (!createConversation) return;
                        try {
                            // Read the current conversations from the cache.
                            const existingData = cache.readQuery<{
                                getConversations: Conversation[];
                            }>({
                                query: GET_CONVERSATIONS,
                                variables: { userId: user.id },
                            });

                            if (!existingData) return;

                            const { getConversations } = existingData;

                            // Check if the new conversation already exists in the list.
                            const alreadyExists = getConversations.some(
                                (conversation) =>
                                    conversation.id === createConversation.id
                            );

                            // If it doesn't exist, write the updated list back to the cache.
                            if (!alreadyExists) {
                                cache.writeQuery({
                                    query: GET_CONVERSATIONS,
                                    variables: { userId: user.id },
                                    data: {
                                        getConversations: [
                                            createConversation,
                                            ...getConversations,
                                        ],
                                    },
                                });
                            }
                        } catch (error) {
                            console.error('Cache update error:', error);
                        }
                    },
                });

                const newConversation =
                    newConversationResult.data.createConversation;

                if (newConversation) {
                    setClosedConversationIds((prevClosed) =>
                        prevClosed.filter((id) => id !== newConversation.id)
                    );

                    if (isLargeScreen) {
                        setSelectedConversation(newConversation);
                    } else {
                        router.push('/chat', {
                            conversationId: newConversation.id,
                        });
                    }
                }

                router.replace('/messages');
                setCurrentFriendId(undefined);
            }
        })();
    }, [currentFriendId, apolloClient, isLargeScreen, router, user?.id]);

    // Fetch conversations using the active user's ID.
    const { data, loading, error } = useQuery(GET_CONVERSATIONS, {
        variables: { userId: user?.id },
        skip: !user,
        fetchPolicy: 'cache-and-network',
    });

    // State to hold the selected conversation on large screens.
    const [selectedConversation, setSelectedConversation] = useState<
        Conversation | undefined
    >(undefined);

    useEffect(() => {
        if (
            isLargeScreen &&
            !selectedConversation &&
            data?.getConversations?.length > 0
        ) {
            // Only pick open conversations.
            const openConversations = data.getConversations.filter(
                (conv: Conversation) => !closedConversationIds.includes(conv.id)
            );

            const newSelected =
                openConversations.length > 0 ? openConversations[0] : undefined;

            setSelectedConversation(newSelected);
        }
    }, [isLargeScreen, selectedConversation, data, closedConversationIds]);

    const handleConversationPress = (conversation: Conversation) => {
        if (isLargeScreen) {
            setSelectedConversation(conversation);
        } else {
            router.push('/chat', { conversationId: conversation.id });
        }
    };

    const handleCloseConversation = useCallback(
        (conversation: Conversation) => {
            void closeConversation({
                variables: {
                    conversationId: conversation.id,
                    closedByUserId: user?.id,
                },
                optimisticResponse: {
                    closeConversation: {
                        __typename: 'Conversation',
                        id: conversation.id,
                    },
                },
                update: (
                    cache,
                    { data: { closeConversation: closedConv } }
                ) => {
                    cache.modify({
                        fields: {
                            getConversations(
                                // eslint-disable-next-line @typescript-eslint/default-param-last
                                existingConversations = [],
                                { readField }
                            ) {
                                return existingConversations.filter(
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    (convRef: any) =>
                                        readField('id', convRef) !==
                                        closedConv.id
                                );
                            },
                        },
                    });
                },
            });

            if (selectedConversation?.id === conversation.id) {
                setClosedConversationIds((prevClosed) => {
                    // Create new closed list using the functional update
                    const newClosed = [conversation.id, ...prevClosed];

                    // Filter out the closed ones using the new closed array
                    const remainingConversations = (
                        data?.getConversations || []
                    ).filter(
                        (conv: Conversation) =>
                            conv.id !== conversation.id &&
                            !newClosed.includes(conv.id)
                    );

                    // Update selectedConversation based on remaining conversations
                    if (remainingConversations.length > 0) {
                        setSelectedConversation(remainingConversations[0]);
                    } else {
                        setSelectedConversation(undefined);
                    }

                    return newClosed;
                });
            } else {
                // Otherwise, just update the closed IDs
                setClosedConversationIds((prev) => [conversation.id, ...prev]);
            }
        },
        [
            closeConversation,
            user?.id,
            data?.getConversations,
            selectedConversation?.id,
        ]
    );

    return (
        <View style={styles.container}>
            {/* Sidebar with conversation list */}
            <View style={styles.sidebar}>
                <View style={styles.dmHeader}>
                    <Text style={styles.dmTitle}>Messages</Text>
                </View>
                {loading ? (
                    <FlatList
                        data={[1, 2, 3, 4, 5]}
                        keyExtractor={(item) => item.toString()}
                        renderItem={() => <ConversationSkeleton />}
                    />
                ) : error ? (
                    <Text style={{ color: theme.colors.Error, margin: 16 }}>
                        Error fetching conversations.
                    </Text>
                ) : (
                    <FlatList
                        data={(data?.getConversations || []).filter(
                            (conv: Conversation) =>
                                !closedConversationIds.includes(conv.id)
                        )}
                        keyExtractor={(item: Conversation) => item.id}
                        renderItem={({ item }) => (
                            <ConversationItem
                                conversation={item}
                                activeUser={user}
                                selected={selectedConversation?.id === item.id}
                                onPress={handleConversationPress}
                                onClose={handleCloseConversation}
                            />
                        )}
                    />
                )}
            </View>

            {isLargeScreen && selectedConversation && (
                <View style={styles.chatWrapper}>
                    <ChatScreen conversation={selectedConversation} />
                </View>
            )}
        </View>
    );
};

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flex: 1,
            flexDirection: 'row',
            backgroundColor: theme.colors.PrimaryBackground,
            height: '100%',
        },
        sidebar: {
            width: 250,
            backgroundColor: theme.colors.PrimaryBackground,
            paddingTop: 10,
        },
        dmHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 15,
            paddingVertical: 8,
        },
        dmTitle: {
            fontSize: 12,
            color: theme.colors.InactiveText,
            fontWeight: 'bold',
        },
        chatWrapper: {
            flex: 1,
            backgroundColor: theme.colors.PrimaryBackground,
        },
    });
}
