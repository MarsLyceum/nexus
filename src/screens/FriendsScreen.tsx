import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    useWindowDimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation } from '@react-navigation/core';
import { useQuery } from '@apollo/client';

import { More } from '../icons';
import { GET_FRIENDS_QUERY } from '../queries';
import { COLORS } from '../constants';
import { useAppSelector, RootState, UserType } from '../redux';
import { AddFriendsScreen } from './AddFriendsScreen';

const getDotColor = (status?: string) => {
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

const getStatusStyle = (status?: string) => ({ color: getDotColor(status) });

export const FriendsScreen = () => {
    const [activeTab, setActiveTab] = useState('Online');
    const navigation = useNavigation();
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;

    const user: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );

    const { data, loading, error } = useQuery(GET_FRIENDS_QUERY, {
        variables: { userId: user?.id },
    });

    // Dummy skeleton data for rendering
    const skeletonData = Array.from({ length: 5 }).map((_, i) => ({
        id: `skeleton-${i}`,
    }));

    const renderFriendItem = ({ item }) => {
        const { friend } = item;
        // Use friend.status, defaulting to "Online" if missing
        const status = friend.status || 'Online';
        const dotColor = getDotColor(status);
        // Use username for display
        const friendName = friend.username;
        const avatarUrl = `https://picsum.photos/seed/${friend.username}/40`;

        return (
            <View style={styles.friendItem}>
                <View style={styles.avatarAndDot}>
                    <ExpoImage
                        source={{ uri: avatarUrl }}
                        style={styles.avatar}
                    />
                    <View
                        style={[
                            styles.statusDot,
                            { backgroundColor: dotColor },
                        ]}
                    />
                </View>
                <View style={styles.friendDetails}>
                    <Text style={styles.friendName}>{friendName}</Text>
                    <Text style={[styles.friendStatus, getStatusStyle(status)]}>
                        {status}
                    </Text>
                </View>
                <View style={styles.friendAction}>
                    <More />
                </View>
            </View>
        );
    };

    const renderSkeletonItem = ({ item }) => {
        return (
            <View style={styles.skeletonFriendItem}>
                <View style={styles.skeletonAvatarAndDot}>
                    <View style={styles.skeletonAvatar} />
                    <View style={styles.skeletonStatusDot} />
                </View>
                <View style={styles.skeletonDetails}>
                    <View style={styles.skeletonNameLine} />
                    <View style={styles.skeletonStatusLine} />
                </View>
                <View style={styles.skeletonAction} />
            </View>
        );
    };

    // Filter based on friend.status, defaulting to "Online" if missing
    const friendsList = data?.getFriends || [];
    const filteredFriends = friendsList.filter(
        (item: { friend: any }) =>
            (item.friend.status || 'Online').toLowerCase() !== 'offline'
    );

    return (
        <View style={styles.container}>
            {/* Header Section */}
            <View style={styles.header}>
                <View style={styles.tabsContainer}>
                    <TouchableOpacity onPress={() => setActiveTab('Online')}>
                        <Text
                            style={[
                                styles.tabItem,
                                activeTab === 'Online' && styles.activeTab,
                            ]}
                        >
                            Online
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('All')}>
                        <Text
                            style={[
                                styles.tabItem,
                                activeTab === 'All' && styles.activeTab,
                            ]}
                        >
                            All
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.tabItem}>Pending</Text>
                </View>
                <TouchableOpacity
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
                </TouchableOpacity>
            </View>

            {activeTab === 'AddFriends' ? (
                isLargeScreen && <AddFriendsScreen />
            ) : (
                <View style={styles.friendsListArea}>
                    <FlatList
                        data={loading ? skeletonData : filteredFriends}
                        keyExtractor={(item) => item.id}
                        renderItem={
                            loading ? renderSkeletonItem : renderFriendItem
                        }
                    />
                </View>
            )}
        </View>
    );
};

const styles = {
    container: {
        flex: 1,
        backgroundColor: COLORS.SecondaryBackground,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: COLORS.PrimaryBackground,
    },
    tabsContainer: {
        flex: 1,
        flexDirection: 'row',
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
    },
    // Skeleton styles (mimicking the real friend item)
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
        width: '30%', // reduced width to mimic shorter text
        backgroundColor: COLORS.InactiveText,
        borderRadius: 4,
        marginBottom: 4,
    },
    skeletonStatusLine: {
        height: 10,
        width: '20%', // reduced width to mimic shorter text
        backgroundColor: COLORS.InactiveText,
        borderRadius: 4,
    },
    skeletonAction: {
        width: 20,
        height: 20,
        backgroundColor: COLORS.TextInput,
        borderRadius: 4,
        marginLeft: 8,
    },
};
