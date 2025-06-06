import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    useWindowDimensions,
    Pressable,
    StyleSheet,
    Modal,
} from 'react-native';
import { useQuery, useMutation } from '@apollo/client';

import { useNexusRouter, useFriendStatus } from '../hooks';
import { FriendItemData } from '../types';
import {
    FriendItem,
    DropdownMenu,
    RawRect,
    ConfirmRemoveFriendModal,
} from '../small-components';
import { GET_FRIENDS, REMOVE_FRIEND, ACCEPT_FRIEND_REQUEST } from '../queries';
import { useAppSelector, RootState } from '../redux';
import { useTheme, Theme } from '../theme';

import { AddFriendsScreen } from './AddFriendsScreen';

export const FriendsScreen: React.FC = () => {
    // Tab and dropdown state.
    const [activeTab, setActiveTab] = useState<string>('Online');
    const [dropdownVisible, setDropdownVisible] = useState<boolean>(false);
    const [dropdownRawRect, setDropdownRawRect] = useState<
        RawRect | undefined
    >();
    const [friendToRemove, setFriendToRemove] = useState<
        FriendItemData | undefined
    >();
    const [removeFriendModalVisible, setRemoveFriendModalVisible] =
        useState<boolean>(false);
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    // Replace useNavigation() with Solito's router.
    const router = useNexusRouter();
    const { width: windowWidth } = useWindowDimensions();
    const isLargeScreen = windowWidth > 768;

    const user = useAppSelector((state: RootState) => state.user.user);

    const { data } = useQuery(GET_FRIENDS, {
        variables: { userId: user?.id },
        skip: !user?.id,
    });
    useFriendStatus(user?.id);

    const [removeFriendMutation] = useMutation(REMOVE_FRIEND, {
        refetchQueries: [
            { query: GET_FRIENDS, variables: { userId: user?.id } },
        ],
    });

    const [acceptFriendMutation] = useMutation(ACCEPT_FRIEND_REQUEST, {
        refetchQueries: [
            { query: GET_FRIENDS, variables: { userId: user?.id } },
        ],
    });

    // Dummy skeleton data for loading.
    const skeletonData: FriendItemData[] = Array.from({ length: 5 }).map(
        (_, i) => ({
            id: `skeleton-${i}`,
            status: 'accepted',
            friend: { username: 'Loading...', status: 'online' },
            requestedBy: undefined,
        })
    );

    // Remove friend callback (used for accepted friends).
    const handleConfirmRemoveFriend = async () => {
        if (!friendToRemove) return;
        try {
            await removeFriendMutation({
                variables: { friendId: friendToRemove.id },
            });
        } catch (error) {
            console.error('Error removing friend:', error);
        } finally {
            setRemoveFriendModalVisible(false);
            setFriendToRemove(undefined);
        }
    };

    // When More is pressed for an accepted friend.
    const handleMorePress = (
        item: FriendItemData,
        measuredRect: { x: number; y: number; width: number; height: number }
    ) => {
        setDropdownRawRect(measuredRect);
        setFriendToRemove(item);
        setDropdownVisible(true);
    };

    // Accept a pending friend request.
    const handleAcceptFriend = async (item: FriendItemData) => {
        try {
            await acceptFriendMutation({
                variables: { friendId: item.id },
            });
        } catch (error) {
            console.error('Error accepting friend request:', error);
        }
    };

    // Reject a pending friend request.
    const handleRejectFriend = async (item: FriendItemData) => {
        console.log('Rejected friend request:', item);
        try {
            await removeFriendMutation({
                variables: { friendId: item.id },
            });
        } catch (error) {
            console.error('Error rejecting friend request:', error);
        }
    };

    // Render function for each friend item.
    const renderFriendItem = ({ item }: { item: FriendItemData }) => {
        if ((item.status?.toLowerCase() || '') === 'pending') {
            // Pass current user id, accept, and reject handlers.
            return (
                <FriendItem
                    item={item}
                    currentUserId={user?.id}
                    onAccept={() => handleAcceptFriend(item)}
                    onReject={() => handleRejectFriend(item)}
                    onMorePress={(_ignored, measuredRect) =>
                        handleMorePress(item, measuredRect)
                    }
                />
            );
        }
        // Otherwise, show the normal friend item with the "more" button.
        return (
            <FriendItem
                item={item}
                currentUserId={user?.id}
                onMorePress={(_ignored, measuredRect) =>
                    handleMorePress(item, measuredRect)
                }
            />
        );
    };

    // Skeleton item placeholder.
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
    const pendingCount = friendsList.filter(
        (item) => (item.status?.toLowerCase() || '') === 'pending'
    ).length;

    // Filter logic based on the active tab.
    let filteredFriends: FriendItemData[] = [];
    // eslint-disable-next-line default-case
    switch (activeTab) {
        case 'Online': {
            filteredFriends = friendsList.filter((item) => {
                const isAccepted = item.status?.toLowerCase() === 'accepted';
                const friendStatus = item.friend.status?.toLowerCase();
                const isOnline =
                    friendStatus === 'online' ||
                    friendStatus === 'online_dnd' ||
                    friendStatus === 'idle';
                return isAccepted && isOnline;
            });
            break;
        }
        case 'All': {
            filteredFriends = friendsList.filter(
                (item) => item.status?.toLowerCase() === 'accepted'
            );
            break;
        }
        case 'Pending': {
            filteredFriends = friendsList.filter(
                (item) => (item.status?.toLowerCase() || '') === 'pending'
            );
            break;
        }
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
                            // Use solito's router to navigate
                            router.push('/add-friends');
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

            {/* Dropdown for the "more" button */}
            {dropdownVisible && dropdownRawRect && (
                <Modal
                    transparent
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
                                setRemoveFriendModalVisible(true);
                                setDropdownVisible(false);
                            }}
                        >
                            <Text
                                style={styles.dropdownMenuItemText}
                                numberOfLines={1}
                            >
                                {friendToRemove &&
                                friendToRemove.status?.toLowerCase() ===
                                    'pending' &&
                                friendToRemove.requestedBy?.id === user?.id
                                    ? 'Cancel Friend Request'
                                    : 'Remove Friend'}
                            </Text>
                        </Pressable>
                    </DropdownMenu>
                </Modal>
            )}

            {/* Confirm Remove Friend Modal */}
            <ConfirmRemoveFriendModal
                visible={removeFriendModalVisible}
                friendToRemove={friendToRemove}
                user={user}
                onConfirm={handleConfirmRemoveFriend}
                onCancel={() => setRemoveFriendModalVisible(false)}
            />
        </View>
    );
};

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.SecondaryBackground,
            position: 'relative',
            height: '100%',
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            backgroundColor: theme.colors.PrimaryBackground,
        },
        tabItem: {
            marginRight: 16,
            color: theme.colors.ActiveText,
            opacity: 0.7,
        },
        activeTab: {
            opacity: 1,
            fontWeight: 'bold',
            fontFamily: 'Roboto_700Bold',
            color: theme.colors.ActiveText,
        },
        addFriendButton: {
            backgroundColor: theme.colors.Primary,
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 4,
        },
        addFriendText: {
            color: theme.colors.ActiveText,
        },
        friendsListArea: {
            flex: 1,
            padding: 8,
        },
        skeletonFriendItem: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.SecondaryBackground,
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
            backgroundColor: theme.colors.TextInput,
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
            borderColor: theme.colors.SecondaryBackground,
            backgroundColor: theme.colors.InactiveText,
        },
        skeletonDetails: {
            flex: 1,
            justifyContent: 'center',
        },
        skeletonNameLine: {
            height: 12,
            width: '30%',
            backgroundColor: theme.colors.InactiveText,
            borderRadius: 4,
            marginBottom: 4,
        },
        skeletonStatusLine: {
            height: 10,
            width: '20%',
            backgroundColor: theme.colors.InactiveText,
            borderRadius: 4,
        },
        dropdownMenuItem: {
            paddingVertical: 8,
            paddingHorizontal: 4,
        },
        dropdownMenuItemText: {
            color: theme.colors.Error,
            fontSize: 14,
        },
    });
}
