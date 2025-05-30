import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Pressable,
} from 'react-native';
import { useQuery, useApolloClient } from '@apollo/client';

import { useTheme, Theme } from '../theme';
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
    const otherParticipantIds = useMemo(
        () =>
            conversation.participantsUserIds.filter(
                (id) => id !== activeUser?.id
            ),
        [activeUser?.id, conversation.participantsUserIds]
    );
    const [closeButtonHovered, setCloseButtonHovered] =
        useState<boolean>(false);
    const [conversationHovered, setConversationHovered] =
        useState<boolean>(false);
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

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
                        backgroundColor: theme.colors.SecondaryBackground,
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
                                backgroundColor: getOnlineStatusDotColor(
                                    theme,
                                    status
                                ),
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
                            onMouseEnter={() => setCloseButtonHovered(true)}
                            onMouseLeave={() => setCloseButtonHovered(false)}
                        >
                            <Cancel
                                size={14}
                                color={
                                    closeButtonHovered
                                        ? theme.colors.ActiveText
                                        : theme.colors.InactiveText
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
        <Pressable
            style={[
                styles.conversationItem,
                selected && styles.selectedConversationItem,
                conversationHovered && {
                    backgroundColor: theme.colors.SecondaryBackground,
                },
            ]}
            onPress={() => onPress(conversation)}
            onMouseEnter={() => setConversationHovered(true)}
            onMouseLeave={() => setConversationHovered(false)}
        >
            <View style={styles.avatarGroup}>
                {groupUsers.slice(0, 3).map((user, index) => {
                    const avatarUrl = `https://picsum.photos/seed/${user?.username}/40`;
                    return (
                        <View
                            key={user?.id}
                            style={[
                                styles.groupAvatar,
                                { marginLeft: index === 0 ? 0 : -15 },
                            ]}
                        >
                            <NexusImage
                                source={avatarUrl}
                                alt="avatar"
                                width={30}
                                height={30}
                                style={{
                                    width: 30,
                                    height: 30,
                                }}
                                contentFit="cover"
                            />
                        </View>
                    );
                })}
            </View>
            <View style={styles.conversationTextContainer}>
                <Text style={styles.conversationTitle}>
                    {groupUsernames || 'Group Chat'}
                </Text>
                <Text style={styles.membersCount}>{totalMembers} Members</Text>
            </View>
            {conversationHovered && (
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => onClose(conversation)}
                >
                    <View
                        onMouseEnter={() => setCloseButtonHovered(true)}
                        onMouseLeave={() => setCloseButtonHovered(false)}
                    >
                        <Cancel
                            size={14}
                            color={
                                closeButtonHovered
                                    ? theme.colors.ActiveText
                                    : theme.colors.InactiveText
                            }
                        />
                    </View>
                </TouchableOpacity>
            )}
        </Pressable>
    );
};

function createStyles(theme: Theme) {
    return StyleSheet.create({
        conversationItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10,
            paddingHorizontal: 15,
        },
        selectedConversationItem: {
            backgroundColor: theme.colors.TertiaryBackground,
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
        groupAvatar: {
            width: 30,
            height: 30,
            borderRadius: 20,
            overflow: 'hidden',
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
        conversationTextContainer: {
            flex: 1,
        },
        conversationTitle: {
            fontSize: 14,
            color: theme.colors.ActiveText,
            fontWeight: 'bold',
        },
        membersCount: {
            fontSize: 12,
            color: theme.colors.InactiveText,
        },
        closeButton: {},
    });
}
