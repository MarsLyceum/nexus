import React, {
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef,
} from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
} from 'react-native';
import { useQuery, useApolloClient, useMutation } from '@apollo/client';

import { useTheme, Theme } from '../theme';
import { useNexusRouter, createNexusParam, useIsComputer } from '../hooks';
import {
    GET_CONVERSATIONS,
    CREATE_CONVERSATION,
    CLOSE_CONVERSATION,
    GET_FRIENDS,
} from '../queries';
import { useAppSelector, RootState, UserType } from '../redux';
import { Conversation, FriendItemData } from '../types';
import {
    ConversationItem,
    ConversationSkeleton,
    Tooltip,
    SendMessageModal,
} from '../small-components';
import { Add } from '../icons';

import { ChatScreen } from './ChatScreen';

// A component for rendering a single conversation item.

const { useParams } = createNexusParam();

export const DMListScreen: React.FC = () => {
    const isComputer = useIsComputer();
    const router = useNexusRouter();
    const apolloClient = useApolloClient();
    const { params } = useParams();
    const { friendId } = params;
    const [currentFriendId, setCurrentFriendId] = useState<string | undefined>(
        friendId
    );
    const createConversationButtonRef = useRef<View>(null);
    const [createConversationButtonAnchor, setCreateConversationButtonAnchor] =
        useState<
            | {
                  x: number;
                  y: number;
                  width: number;
                  height: number;
              }
            | undefined
        >();

    const [showSendMessageModal, setShowSendMessageModal] = useState(false);
    const [closeConversation] = useMutation(CLOSE_CONVERSATION);
    const [closedConversationIds, setClosedConversationIds] = useState<
        string[]
    >([]);
    const { theme } = useTheme();
    const styles = useMemo(
        () => createStyles(theme, isComputer),
        [theme, isComputer]
    );

    // Get the active user from Redux.
    const user: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );
    const [dmHeaderHovered, setDmHeaderHovered] = useState<boolean>(false);
    const {
        data: friendsData,
        // loading: friendsLoading,
        // error: friendsError,
    } = useQuery(GET_FRIENDS, {
        variables: { userId: user?.id },
    });

    const setActiveConversation = useCallback(
        (newConversation?: Conversation) => {
            if (newConversation) {
                setClosedConversationIds((prevClosed) =>
                    prevClosed.filter((id) => id !== newConversation.id)
                );

                if (isComputer) {
                    setSelectedConversation(newConversation);
                } else {
                    router.push('/chat', {
                        conversationId: newConversation.id,
                    });
                }
            }
        },
        [isComputer, router]
    );

    useEffect(() => {
        if (friendId) {
            setCurrentFriendId(friendId);
        }
    }, [friendId]);

    // Fetch conversations using the active user's ID.
    const {
        data,
        loading,
        error,
        refetch: refetchConversations,
    } = useQuery(GET_CONVERSATIONS, {
        variables: { userId: user?.id },
        skip: !user,
        fetchPolicy: 'cache-and-network',
        notifyOnNetworkStatusChange: true,
    });

    const createConversation = useCallback(
        async (friendIds: string[]): Promise<Conversation> => {
            const newConversation = await apolloClient.mutate({
                mutation: CREATE_CONVERSATION,
                variables: {
                    type: friendIds.length === 1 ? 'direct' : 'group',
                    participantsUserIds: [...friendIds, user?.id],
                    requestedByUserId: user?.id,
                },
            });
            await refetchConversations();

            return newConversation.data.createConversation;
        },
        [user?.id, apolloClient, refetchConversations]
    );

    useEffect(() => {
        void (async () => {
            if (currentFriendId && user?.id) {
                const newConversation = await createConversation([
                    currentFriendId,
                ]);

                setActiveConversation(newConversation);

                router.replace('/messages');
                setCurrentFriendId(undefined);
            }
        })();
    }, [
        currentFriendId,
        apolloClient,
        router,
        user?.id,
        createConversation,
        setActiveConversation,
    ]);

    // State to hold the selected conversation on large screens.
    const [selectedConversation, setSelectedConversation] = useState<
        Conversation | undefined
    >(undefined);

    useEffect(() => {
        if (
            isComputer &&
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
    }, [isComputer, selectedConversation, data, closedConversationIds]);

    const handleConversationPress = useCallback(
        (conversation: Conversation) => {
            if (isComputer) {
                setSelectedConversation(conversation);
            } else {
                router.push('/chat', { conversationId: conversation.id });
            }
        },
        [isComputer, router]
    );

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
                <View
                    style={styles.dmHeader}
                    onMouseEnter={() => setDmHeaderHovered(true)}
                    onMouseLeave={() => setDmHeaderHovered(false)}
                >
                    <Text
                        style={[
                            styles.dmTitle,
                            {
                                color: dmHeaderHovered
                                    ? theme.colors.ActiveText
                                    : theme.colors.InactiveText,
                            },
                        ]}
                    >
                        Messages
                    </Text>
                    <Tooltip text="Create Message">
                        <TouchableOpacity
                            ref={createConversationButtonRef}
                            onPress={() => {
                                if (createConversationButtonRef.current) {
                                    createConversationButtonRef.current.measureInWindow(
                                        (
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            x: any,
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            y: any,
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-shadow
                                            width: any,
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            height: any
                                        ) => {
                                            setCreateConversationButtonAnchor({
                                                x,
                                                y,
                                                width,
                                                height,
                                            });
                                            setShowSendMessageModal(true);
                                        }
                                    );
                                } else {
                                    setShowSendMessageModal(true);
                                }
                            }}
                        >
                            <Add
                                size={14}
                                color={
                                    dmHeaderHovered
                                        ? theme.colors.ActiveText
                                        : theme.colors.InactiveText
                                }
                            />
                        </TouchableOpacity>
                    </Tooltip>
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

            {isComputer && selectedConversation && (
                <View style={styles.chatWrapper}>
                    <ChatScreen conversation={selectedConversation} />
                </View>
            )}

            <SendMessageModal
                visible={showSendMessageModal}
                onClose={() => setShowSendMessageModal(false)}
                onCreateDM={async (friendIds) => {
                    const newConversation = await createConversation(friendIds);
                    setActiveConversation(newConversation);
                }}
                anchorPosition={createConversationButtonAnchor}
                friends={
                    friendsData?.getFriends
                        .filter(
                            (friendData: FriendItemData) =>
                                friendData.status === 'accepted'
                        )
                        .map(
                            (friendData: FriendItemData) => friendData.friend
                        ) ?? []
                }
            />
        </View>
    );
};

function createStyles(theme: Theme, isComputer: boolean) {
    return StyleSheet.create({
        container: {
            flex: 1,
            flexDirection: 'row',
            backgroundColor: theme.colors.PrimaryBackground,
            height: '100%',
        },
        sidebar: {
            width: isComputer ? 250 : '100%',
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
            fontFamily: 'Roboto_700Bold',
        },
        chatWrapper: {
            flex: 1,
            backgroundColor: theme.colors.PrimaryBackground,
        },
    });
}
