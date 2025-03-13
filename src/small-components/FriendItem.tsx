import React, { useRef } from 'react';
import {
    View,
    Text,
    Pressable,
    Platform,
    StyleSheet,
    View as RNView,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { More } from '../icons';
import { COLORS } from '../constants';

// Define types for Friend and FriendItemData.
export type Friend = {
    username: string;
    status?: string;
};

export type FriendItemData = {
    friend: Friend;
    id: string;
};

type FriendItemProps = {
    item: FriendItemData;
    onMorePress: (
        friend: Friend,
        measuredRect: { x: number; y: number; width: number; height: number }
    ) => void;
};

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

const getStatusStyle = (status?: string): { color: string } => ({
    color: getDotColor(status),
});

export const FriendItem: React.FC<FriendItemProps> = ({
    item,
    onMorePress,
}) => {
    const moreButtonContainerRef = useRef<RNView>(null);
    const { friend } = item;
    const status = friend.status || 'Online';
    const dotColor = getDotColor(status);
    const friendName = friend.username;
    const avatarUrl = `https://picsum.photos/seed/${friend.username}/40`;

    return (
        <View style={styles.friendItem}>
            <View style={styles.avatarAndDot}>
                <ExpoImage source={{ uri: avatarUrl }} style={styles.avatar} />
                <View
                    style={[styles.statusDot, { backgroundColor: dotColor }]}
                />
            </View>
            <View style={styles.friendDetails}>
                <Text style={styles.friendName}>{friendName}</Text>
                <Text style={[styles.friendStatus, getStatusStyle(status)]}>
                    {status}
                </Text>
            </View>
            <View style={styles.friendAction}>
                <View ref={moreButtonContainerRef}>
                    <Pressable
                        onPress={() => {
                            if (moreButtonContainerRef.current) {
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
                        style={({ hovered }) => [
                            styles.moreButton,
                            hovered &&
                                Platform.OS === 'web' && { cursor: 'pointer' },
                        ]}
                    >
                        <More />
                    </Pressable>
                </View>
            </View>
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
        marginBottom: 4,
    },
    friendStatus: {
        color: COLORS.InactiveText,
        fontSize: 12,
    },
    friendAction: {
        marginLeft: 8,
        position: 'relative',
    },
    moreButton: {
        padding: 4,
    },
});
