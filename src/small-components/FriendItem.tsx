import React, { useRef } from 'react';
import { View, Text, StyleSheet, View as RNView } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { More, Checkmark, Cancel } from '../icons';
import { COLORS } from '../constants';
import { ActionButton } from './ActionButton';

export type Friend = {
    username: string;
    // This field will be used for online status if provided
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

// Returns dot color based on online status (defaults to green for "online")
const getDotColor = (status?: string): string => {
    const currentStatus = status ? status.toLowerCase() : 'online';
    switch (currentStatus) {
        case 'online': {
            return '#43B581';
        }
        case 'idle': {
            return '#FAA61A';
        }
        case 'dnd':
        case 'do not disturb': {
            return '#F04747';
        }
        default: {
            return '#B9BBBE';
        }
    }
};

// Helper function to capitalize the first letter
const capitalize = (s: string): string =>
    s.charAt(0).toUpperCase() + s.slice(1);

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
    // - If pending, show outgoing/incoming friend request
    // - If relationship is accepted, show online status (or default "Online")
    // - Otherwise, show the relationship status (capitalized) if available
    let displayedStatus = '';
    if (isPending) {
        displayedStatus = isRequestedByMe
            ? 'Outgoing Friend Request'
            : 'Incoming Friend Request';
    } else if (relationshipStatus === 'accepted') {
        displayedStatus = onlineStatus ? capitalize(onlineStatus) : 'Online';
    } else {
        displayedStatus = relationshipStatus
            ? capitalize(relationshipStatus)
            : 'Online';
    }

    // For dot color, if relationship is accepted, we use the online status (or default to "online")
    const statusForDot =
        relationshipStatus === 'accepted'
            ? onlineStatus
                ? onlineStatus
                : 'online'
            : relationshipStatus || 'online';
    const dotColor = getDotColor(statusForDot);
    const avatarUrl = `https://picsum.photos/seed/${friend.username}/40`;

    return (
        <View style={styles.friendItem}>
            {/* Avatar + (optional) Status Dot */}
            <View style={styles.avatarAndDot}>
                <ExpoImage source={{ uri: avatarUrl }} style={styles.avatar} />
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
                        <Checkmark />
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
