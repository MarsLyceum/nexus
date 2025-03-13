import React, { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    useWindowDimensions,
    Pressable,
    Platform,
    StyleSheet,
    Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/core';
import { useQuery } from '@apollo/client';

import {
    FriendItem,
    Friend,
    FriendItemData,
    DropdownMenu,
    RawRect,
    ConfirmRemoveFriendModal,
} from '../small-components';
import { GET_FRIENDS_QUERY } from '../queries';
import { COLORS } from '../constants';
import { useAppSelector, RootState } from '../redux';
import { AddFriendsScreen } from './AddFriendsScreen';

export const FriendsScreen: React.FC = () => {
    // Tab and dropdown state.
    const [activeTab, setActiveTab] = useState<string>('Online');
    const [dropdownVisible, setDropdownVisible] = useState<boolean>(false);
    // Measured rectangle from the More button.
    const [dropdownRawRect, setDropdownRawRect] = useState<RawRect | null>(
        null
    );
    const [dropdownFriend, setDropdownFriend] = useState<Friend | null>(null);
    const [removeFriendModalVisible, setRemoveFriendModalVisible] =
        useState<boolean>(false);
    const [friendToRemove, setFriendToRemove] = useState<Friend | null>(null);

    const navigation = useNavigation();
    const { width: windowWidth } = useWindowDimensions();
    const isLargeScreen = windowWidth > 768;

    const user = useAppSelector((state: RootState) => state.user.user);
    const { data } = useQuery(GET_FRIENDS_QUERY, {
        variables: { userId: user?.id },
    });

    // Dummy skeleton data for loading.
    // We include a main status ("accepted") so filtering works consistently.
    const skeletonData: FriendItemData[] = Array.from({ length: 5 }).map(
        (_, i) => ({
            id: `skeleton-${i}`,
            status: 'accepted',
            friend: { username: 'Loading...', status: 'online' },
        })
    );

    const handleConfirmRemoveFriend = () => {
        setRemoveFriendModalVisible(false);
        setFriendToRemove(null);
    };

    // When More is pressed, store the measured rect.
    const handleMorePress = (friend: Friend, measuredRect: RawRect) => {
        setDropdownRawRect(measuredRect);
        setDropdownFriend(friend);
        setDropdownVisible(true);
    };

    const renderFriendItem = ({ item }: { item: FriendItemData }) => (
        <FriendItem item={item} onMorePress={handleMorePress} />
    );

    const renderSkeletonItem = () => (
        <View style={styles.skeletonFriendItem}>
            <View style={styles.skeletonAvatarAndDot}>
                <View style={styles.skeletonAvatar} />
                <View style={styles.skeletonStatusDot} />
            </View>
            <View style={styles.skeletonDetails}>
                <View style={styles.skeletonNameLine} />
                <View style={styles.skeletonStatusLine} />
            </View>
        </View>
    );

    const friendsList: FriendItemData[] = data?.getFriends || [];

    // Compute pending requests count using the main status.
    const pendingCount = friendsList.filter(
        (item) => (item.status?.toLowerCase() || '') === 'pending'
    ).length;

    // Filtering logic based on activeTab.
    let filteredFriends: FriendItemData[] = [];
    if (activeTab === 'Online') {
        // Only accepted friends (main status) that are online (friend status).
        filteredFriends = friendsList.filter((item) => {
            const isAccepted =
                (item.status?.toLowerCase() || '') === 'accepted';
            // Default online status to 'online' if missing.
            const isOnline =
                (item.friend.status?.toLowerCase() || 'online') === 'online';
            return isAccepted && isOnline;
        });
    } else if (activeTab === 'All') {
        // All accepted friends (main status), regardless of their online status.
        filteredFriends = friendsList.filter(
            (item) => (item.status?.toLowerCase() || '') === 'accepted'
        );
    } else if (activeTab === 'Pending') {
        // Only pending friend requests (main status).
        filteredFriends = friendsList.filter(
            (item) => (item.status?.toLowerCase() || '') === 'pending'
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => setActiveTab('Online')}>
                    <Text
                        style={[
                            styles.tabItem,
                            activeTab === 'Online' && styles.activeTab,
                        ]}
                    >
                        Online
                    </Text>
                </Pressable>
                <Pressable onPress={() => setActiveTab('All')}>
                    <Text
                        style={[
                            styles.tabItem,
                            activeTab === 'All' && styles.activeTab,
                        ]}
                    >
                        All
                    </Text>
                </Pressable>
                <Pressable onPress={() => setActiveTab('Pending')}>
                    <Text
                        style={[
                            styles.tabItem,
                            activeTab === 'Pending' && styles.activeTab,
                        ]}
                    >
                        Pending {pendingCount > 0 ? `(${pendingCount})` : ''}
                    </Text>
                </Pressable>
                <Pressable
                    style={styles.addFriendButton}
                    onPress={() => {
                        if (isLargeScreen) {
                            setActiveTab('AddFriends');
                        } else {
                            navigation.navigate('AddFriends');
                        }
                    }}
                >
                    <Text style={styles.addFriendText}>Add Friend</Text>
                </Pressable>
            </View>

            {activeTab === 'AddFriends' ? (
                isLargeScreen && <AddFriendsScreen />
            ) : (
                <View style={styles.friendsListArea}>
                    <FlatList
                        data={data ? filteredFriends : skeletonData}
                        keyExtractor={(item) => item.id}
                        renderItem={
                            data ? renderFriendItem : renderSkeletonItem
                        }
                    />
                </View>
            )}

            {dropdownVisible && dropdownRawRect && (
                <Modal
                    transparent={true}
                    animationType="none"
                    visible={dropdownVisible}
                    onRequestClose={() => setDropdownVisible(false)}
                >
                    <DropdownMenu
                        rawRect={dropdownRawRect}
                        onDismiss={() => setDropdownVisible(false)}
                    >
                        <Pressable
                            style={styles.dropdownMenuItem}
                            onPress={() => {
                                setFriendToRemove(dropdownFriend);
                                setRemoveFriendModalVisible(true);
                                setDropdownVisible(false);
                            }}
                        >
                            <Text
                                style={styles.dropdownMenuItemText}
                                numberOfLines={1}
                            >
                                Remove Friend
                            </Text>
                        </Pressable>
                    </DropdownMenu>
                </Modal>
            )}

            <ConfirmRemoveFriendModal
                visible={removeFriendModalVisible}
                friend={friendToRemove}
                onConfirm={handleConfirmRemoveFriend}
                onCancel={() => setRemoveFriendModalVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.SecondaryBackground,
        position: 'relative',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: COLORS.PrimaryBackground,
    },
    tabItem: {
        marginRight: 16,
        color: COLORS.White,
        opacity: 0.7,
    },
    activeTab: {
        opacity: 1,
        fontWeight: 'bold',
        fontFamily: 'Roboto_700Bold',
        color: COLORS.White,
    },
    addFriendButton: {
        backgroundColor: COLORS.Primary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 4,
    },
    addFriendText: {
        color: COLORS.White,
    },
    friendsListArea: {
        flex: 1,
        padding: 8,
    },
    skeletonFriendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.SecondaryBackground,
        marginVertical: 4,
        borderRadius: 4,
        padding: 12,
    },
    skeletonAvatarAndDot: {
        position: 'relative',
        marginRight: 8,
    },
    skeletonAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.TextInput,
        marginRight: 8,
    },
    skeletonStatusDot: {
        position: 'absolute',
        bottom: 0,
        right: 5,
        width: 15,
        height: 15,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: COLORS.SecondaryBackground,
        backgroundColor: COLORS.InactiveText,
    },
    skeletonDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    skeletonNameLine: {
        height: 12,
        width: '30%',
        backgroundColor: COLORS.InactiveText,
        borderRadius: 4,
        marginBottom: 4,
    },
    skeletonStatusLine: {
        height: 10,
        width: '20%',
        backgroundColor: COLORS.InactiveText,
        borderRadius: 4,
    },
    dropdownMenuItem: {
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    dropdownMenuItemText: {
        color: COLORS.Error,
        fontSize: 14,
    },
});
