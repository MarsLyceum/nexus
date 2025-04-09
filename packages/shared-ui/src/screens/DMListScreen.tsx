import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    useWindowDimensions,
    FlatList,
} from 'react-native';
import { useQuery, useApolloClient } from '@apollo/client';

import { NexusImage } from '../small-components';
import { useNexusRouter, createNexusParam } from '../hooks';
import { COLORS } from '../constants';
import { ChatScreen } from './ChatScreen';
import {
    GET_CONVERSATIONS,
    FETCH_USER_QUERY,
    CREATE_CONVERSATION,
} from '../queries';
import { useAppSelector, RootState, UserType } from '../redux';
import { getOnlineStatusDotColor } from '../utils';
import { Conversation } from '../types';

interface ConversationItemProps {
    conversation: Conversation;
    activeUser: UserType;
    selected: boolean;
    onPress: (conversation: Conversation) => void;
}

// A skeleton placeholder for a conversation item.
const ConversationSkeleton: React.FC = () => (
    <View style={styles.skeletonItem}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonTextContainer}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonSubtitle} />
        </View>
    </View>
);

// A component for rendering a single conversation item.
export const ConversationItem: React.FC<ConversationItemProps> = ({
    conversation,
    activeUser,
    selected,
    onPress,
}) => {
    const client = useApolloClient();
    const [groupUsers, setGroupUsers] = useState<UserType[]>([]);
    const otherParticipantIds = conversation.participantsUserIds.filter(
        (id) => id !== activeUser?.id
    );

    // --- ONE-TO-ONE CONVERSATION ---
    if (otherParticipantIds.length === 1) {
        const friendId = otherParticipantIds[0];
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { data, loading } = useQuery(FETCH_USER_QUERY, {
            variables: { userId: friendId },
        });

        // Instead of showing the friendId (uuid) briefly,
        // we render a skeleton until the username loads.
        if (loading) {
            return <ConversationSkeleton />;
        }

        const username = data?.fetchUser ? data.fetchUser.username : friendId;
        const status = data?.fetchUser ? data.fetchUser.status : 'offline';
        const avatarUrl = `https://picsum.photos/seed/${username}/40`;

        return (
            <TouchableOpacity
                style={[
                    styles.conversationItem,
                    selected && styles.selectedConversationItem,
                ]}
                onPress={() => onPress(conversation)}
            >
                <View style={styles.avatarAndDot}>
                    <NexusImage
                        source={avatarUrl}
                        alt="avatar"
                        width={40}
                        height={40}
                        style={styles.avatar}
                        contentFit="cover"
                    />
                    <View
                        style={[
                            styles.statusDot,
                            {
                                backgroundColor:
                                    getOnlineStatusDotColor(status),
                            },
                        ]}
                    />
                </View>
                <View style={styles.conversationTextContainer}>
                    <Text style={styles.conversationTitle}>{username}</Text>
                </View>
            </TouchableOpacity>
        );
    }

    // --- GROUP CONVERSATION ---
    // For group conversations, fetch info for all participants (excluding the active user).
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        let isMounted = true;
        const fetchGroupUsers = async () => {
            try {
                const results = await Promise.all(
                    otherParticipantIds.map((id) =>
                        client.query({
                            query: FETCH_USER_QUERY,
                            variables: { userId: id },
                        })
                    )
                );
                if (isMounted) {
                    const usersData = results.map((res) => res.data.fetchUser);
                    setGroupUsers(usersData);
                }
            } catch (error) {
                console.error('Error fetching group users:', error);
            }
        };
        void fetchGroupUsers();
        return () => {
            isMounted = false;
        };
    }, [otherParticipantIds, client]);

    const groupUsernames = groupUsers.map((u) => u?.username).join(', ');
    const totalMembers = conversation.participantsUserIds.length;

    return (
        <TouchableOpacity
            style={[
                styles.conversationItem,
                selected && styles.selectedConversationItem,
            ]}
            onPress={() => onPress(conversation)}
        >
            <View style={styles.avatarGroup}>
                {groupUsers.slice(0, 3).map((user, index) => {
                    const avatarUrl = `https://picsum.photos/seed/${user?.username}/40`;
                    return (
                        <NexusImage
                            key={user?.id}
                            source={avatarUrl}
                            alt="avatar"
                            width={40}
                            height={40}
                            // @ts-expect-error web only
                            style={[
                                // @ts-expect-error web only
                                styles.groupAvatar,
                                { marginLeft: index === 0 ? 0 : -10 },
                            ]}
                            contentFit="cover"
                        />
                    );
                })}
            </View>
            <View style={styles.conversationTextContainer}>
                <Text style={styles.conversationTitle}>
                    {groupUsernames || 'Group Chat'}
                </Text>
                <Text style={styles.membersCount}>{totalMembers} Members</Text>
            </View>
        </TouchableOpacity>
    );
};

const { useParams } = createNexusParam();

export const DMListScreen: React.FC = () => {
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;
    const router = useNexusRouter();
    const apolloClient = useApolloClient();
    const { params } = useParams();
    const { friendId } = params;

    // Get the active user from Redux.
    const user: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );

    useEffect(() => {
        void (async () => {
            if (friendId && user?.id) {
                const newConversationResult = await apolloClient.mutate({
                    mutation: CREATE_CONVERSATION,
                    variables: {
                        type: 'direct',
                        participantsUserIds: [friendId, user?.id],
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
                    if (isLargeScreen) {
                        setSelectedConversation(newConversation);
                    } else {
                        router.push('/chat', {
                            conversationId: newConversation.id,
                        });
                    }
                }
            }
        })();
    }, [friendId, apolloClient, isLargeScreen, router, user?.id]);

    // Fetch conversations using the active user's ID.
    const { data, loading, error } = useQuery(GET_CONVERSATIONS, {
        variables: { userId: user?.id },
        skip: !user,
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
            setSelectedConversation(data.getConversations[0]);
        }
    }, [isLargeScreen, selectedConversation, data]);

    const handleConversationPress = (conversation: Conversation) => {
        if (isLargeScreen) {
            setSelectedConversation(conversation);
        } else {
            router.push('/chat', { conversationId: conversation.id });
        }
    };

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
                    <Text style={{ color: COLORS.Error, margin: 16 }}>
                        Error fetching conversations.
                    </Text>
                ) : (
                    <FlatList
                        data={data?.getConversations || []}
                        keyExtractor={(item: Conversation) => item.id}
                        renderItem={({ item }) => (
                            <ConversationItem
                                conversation={item}
                                activeUser={user}
                                selected={selectedConversation?.id === item.id}
                                onPress={handleConversationPress}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: COLORS.PrimaryBackground,
        height: '100%',
    },
    sidebar: {
        width: 250,
        backgroundColor: COLORS.PrimaryBackground,
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
        color: COLORS.InactiveText,
        fontWeight: 'bold',
    },
    chatWrapper: {
        flex: 1,
        backgroundColor: COLORS.PrimaryBackground,
    },
    conversationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    selectedConversationItem: {
        backgroundColor: COLORS.SecondaryBackground,
        borderRadius: 5,
    },
    avatarAndDot: {
        position: 'relative',
        marginRight: 10,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
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
    conversationTextContainer: {
        flex: 1,
    },
    conversationTitle: {
        fontSize: 14,
        color: COLORS.White,
        fontWeight: 'bold',
    },
    membersCount: {
        fontSize: 12,
        color: COLORS.InactiveText,
    },
    // Skeleton styles using palette colors
    skeletonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    skeletonAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.InactiveText,
    },
    skeletonTextContainer: {
        flex: 1,
        marginLeft: 10,
    },
    skeletonTitle: {
        width: '50%',
        height: 10,
        backgroundColor: COLORS.InactiveText,
        borderRadius: 4,
        marginBottom: 6,
    },
    skeletonSubtitle: {
        width: '30%',
        height: 10,
        backgroundColor: COLORS.InactiveText,
        borderRadius: 4,
    },
});
