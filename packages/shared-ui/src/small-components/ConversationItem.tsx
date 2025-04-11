import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Pressable,
} from 'react-native';
import { useQuery, useApolloClient } from '@apollo/client';

import { COLORS } from '../constants';
import { FETCH_USER_QUERY } from '../queries';
import { UserType } from '../redux';
import { getOnlineStatusDotColor } from '../utils';
import { Conversation } from '../types';
import { Cancel } from '../icons';

import { NexusImage } from './NexusImage';
import { ConversationSkeleton } from './ConversationSkeleton';

type ConversationItemProps = {
    conversation: Conversation;
    activeUser: UserType;
    selected: boolean;
    onPress: (conversation: Conversation) => void;
    onClose: (conversation: Conversation) => void;
};

export const ConversationItem: React.FC<ConversationItemProps> = ({
    conversation,
    activeUser,
    selected,
    onPress,
    onClose,
}) => {
    const client = useApolloClient();
    const [groupUsers, setGroupUsers] = useState<UserType[]>([]);
    const otherParticipantIds = conversation.participantsUserIds.filter(
        (id) => id !== activeUser?.id
    );
    const [closeButtonHovered, setCloseButtonHovered] =
        useState<boolean>(false);
    const [conversationHovered, setConversationHovered] =
        useState<boolean>(false);

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
            <Pressable
                style={[
                    styles.conversationItem,
                    selected && styles.selectedConversationItem,
                    conversationHovered && {
                        backgroundColor: COLORS.TertiaryBackground,
                    },
                ]}
                onPress={() => onPress(conversation)}
                onMouseEnter={() => setConversationHovered(true)}
                onMouseLeave={() => setConversationHovered(false)}
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
                {conversationHovered && (
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => onClose(conversation)}
                    >
                        <View
                            // @ts-expect-error mouse enter
                            onMouseEnter={() => setCloseButtonHovered(true)}
                            onMouseLeave={() => setCloseButtonHovered(false)}
                        >
                            <Cancel
                                size={14}
                                color={
                                    closeButtonHovered
                                        ? COLORS.White
                                        : COLORS.InactiveText
                                }
                            />
                        </View>
                    </TouchableOpacity>
                )}
            </Pressable>
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
                conversationHovered && {
                    backgroundColor: COLORS.TertiaryBackground,
                },
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

const styles = StyleSheet.create({
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
    closeButton: {},
});
