import React, { useRef } from 'react';
import { View, Text, StyleSheet, View as RNView } from 'react-native';

import { NexusImage } from './NexusImage';
import { More, CheckMark, Cancel } from '../icons';
import { COLORS } from '../constants';
import { ActionButton } from './ActionButton';
import { getOnlineStatusDotColor } from '../utils';

export type Friend = {
    id?: string;
    email?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    status?: string;
};

export type FriendItemData = {
    friend: Friend;
    id: string;
    // This is the relationship status (accepted, pending, blocked, etc.)
    status?: string;
    requestedBy?: {
        id: string;
        email: string;
        username: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        status: string;
    } | null;
};

type FriendItemProps = {
    item: FriendItemData;
    currentUserId?: string;
    onMorePress?: (
        friend: Friend,
        measuredRect: { x: number; y: number; width: number; height: number }
    ) => void;
    onAccept?: () => void;
    onReject?: () => void;
};

// Mapping for displayed statuses
const displayStatusMap: { [key: string]: string } = {
    online: 'Online',
    online_dnd: 'Online (Do Not Disturb)',
    idle: 'Idle',
    offline: 'Offline',
    invisible: 'Invisible',
    offline_dnd: 'Offline (Do Not Disturb)',
};

export const FriendItem: React.FC<FriendItemProps> = ({
    item,
    currentUserId,
    onMorePress,
    onAccept,
    onReject,
}) => {
    const moreButtonContainerRef = useRef<RNView>(null);
    const { friend, status: relationshipStatusRaw, requestedBy } = item;
    const relationshipStatus = relationshipStatusRaw
        ? relationshipStatusRaw.toLowerCase()
        : '';

    // friend.status is expected to be the online status
    const onlineStatus = friend.status
        ? friend.status.toLowerCase()
        : undefined;
    const isPending = relationshipStatus === 'pending';
    const isRequestedByMe = requestedBy?.id === currentUserId;

    // Determine displayed status:
    let displayedStatus = '';
    if (isPending) {
        displayedStatus = isRequestedByMe
            ? 'Outgoing Friend Request'
            : 'Incoming Friend Request';
    } else if (relationshipStatus === 'accepted') {
        displayedStatus = onlineStatus
            ? displayStatusMap[onlineStatus] ||
              onlineStatus.charAt(0).toUpperCase() + onlineStatus.slice(1)
            : 'Online';
    } else {
        displayedStatus = relationshipStatus
            ? relationshipStatus.charAt(0).toUpperCase() +
              relationshipStatus.slice(1)
            : 'Online';
    }

    // For dot color, if relationship is accepted, we use the online status (or default to "online")
    const statusForDot =
        relationshipStatus === 'accepted'
            ? onlineStatus || 'online'
            : relationshipStatus || 'online';
    const dotColor = getOnlineStatusDotColor(statusForDot);
    const avatarUrl = `https://picsum.photos/seed/${friend.username}/40`;

    return (
        <View style={styles.friendItem}>
            {/* Avatar + (optional) Status Dot */}
            <View style={styles.avatarAndDot}>
                <NexusImage
                    source={avatarUrl}
                    style={styles.avatar}
                    width={32}
                    height={32}
                    alt="Friend avatar"
                />
                {relationshipStatus === 'accepted' && (
                    <View
                        style={[
                            styles.statusDot,
                            { backgroundColor: dotColor },
                        ]}
                    />
                )}
            </View>

            {/* Username + Status Text */}
            <View style={styles.friendDetails}>
                <Text style={styles.friendName}>{friend.username}</Text>
                <Text style={styles.friendStatus}>{displayedStatus}</Text>
            </View>

            {/* If pending and NOT requested by me, show accept & ignore actions */}
            {isPending && !isRequestedByMe ? (
                <View style={styles.pendingActions}>
                    <ActionButton
                        onPress={() => onAccept && onAccept()}
                        tooltipText="Accept"
                    >
                        <CheckMark />
                    </ActionButton>
                    <ActionButton
                        onPress={() => onReject && onReject()}
                        tooltipText="Ignore"
                    >
                        <Cancel />
                    </ActionButton>
                </View>
            ) : (
                // For accepted friends or outgoing requests
                <View style={styles.friendAction}>
                    <View ref={moreButtonContainerRef}>
                        <ActionButton
                            onPress={() => {
                                if (
                                    moreButtonContainerRef.current &&
                                    onMorePress
                                ) {
                                    moreButtonContainerRef.current.measureInWindow(
                                        (
                                            x: number,
                                            y: number,
                                            width: number,
                                            height: number
                                        ) => {
                                            onMorePress(friend, {
                                                x,
                                                y,
                                                width,
                                                height,
                                            });
                                        }
                                    );
                                }
                            }}
                            tooltipText="More"
                        >
                            <More />
                        </ActionButton>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.SecondaryBackground,
        marginVertical: 4,
        borderRadius: 4,
        padding: 12,
    },
    avatarAndDot: {
        position: 'relative',
        marginRight: 8,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
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
    friendDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    friendName: {
        fontWeight: 'bold',
        fontFamily: 'Roboto_700Bold',
        color: COLORS.White,
        marginBottom: 2,
    },
    friendStatus: {
        color: COLORS.InactiveText,
        fontSize: 12,
    },
    friendAction: {
        marginLeft: 8,
        position: 'relative',
    },
    pendingActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
});
