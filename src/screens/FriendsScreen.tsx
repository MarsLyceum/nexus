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
import { COLORS } from '../constants';
import { AddFriendsScreen } from './AddFriendsScreen';

const friendsData = [
    {
        id: '1',
        name: 'Alex Spills The Beans',
        status: 'Online',
        avatarUrl: 'https://picsum.photos/seed/alex/40',
    },
    {
        id: '2',
        name: 'AngryFluffyMoth',
        status: 'Online',
        avatarUrl: 'https://picsum.photos/seed/moth/40',
    },
    {
        id: '3',
        name: 'Geno',
        status: 'Online',
        avatarUrl: 'https://picsum.photos/seed/geno/40',
    },
    {
        id: '4',
        name: 'grumpygoblinwizard',
        status: 'Idle',
        avatarUrl: 'https://picsum.photos/seed/grumpygoblinwizard/40',
    },
    {
        id: '5',
        name: 'CaptCrunch',
        status: 'Offline',
        avatarUrl: 'https://picsum.photos/seed/CaptCrunch/40',
    },
    // ... more friends
];

const getDotColor = (status: string) => {
    switch (status.toLowerCase()) {
        case 'online': {
            return '#43B581';
        } // green
        case 'idle': {
            return '#FAA61A';
        } // orange
        case 'dnd':
        case 'do not disturb': {
            return '#F04747';
        } // red
        default: {
            return '#B9BBBE';
        } // default grey
    }
};
const getStatusStyle = (status: string) => ({ color: getDotColor(status) });

export const FriendsScreen = () => {
    const [activeTab, setActiveTab] = useState('Online');
    const navigation = useNavigation();
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;

    const renderFriendItem = ({ item }) => {
        const dotColor = getDotColor(item.status);

        return (
            <View style={styles.friendItem}>
                <View style={styles.avatarAndDot}>
                    {/* Left side: avatar */}
                    <ExpoImage
                        source={{ uri: item.avatarUrl }} // or a local asset
                        style={styles.avatar}
                    />
                    <View
                        style={[
                            styles.statusDot,
                            { backgroundColor: dotColor },
                        ]}
                    />
                </View>

                {/* Middle: name + status */}
                <View style={styles.friendDetails}>
                    <Text style={styles.friendName}>{item.name}</Text>
                    <Text
                        style={[
                            styles.friendStatus,
                            getStatusStyle(item.status),
                        ]}
                    >
                        {item.status}
                    </Text>
                </View>

                {/* Right side: could be a switch, icon, or a "..." button */}
                <View style={styles.friendAction}>
                    {/* Example placeholder text or an icon */}
                    <Text style={{ color: '#FFF' }}>...</Text>
                </View>
            </View>
        );
    };

    const filteredFriends =
        activeTab === 'Online'
            ? friendsData.filter(
                  (friend) => friend.status.toLowerCase() !== 'offline'
              )
            : friendsData;

    return (
        <View style={styles.container}>
            {/* Header Section */}
            {/* @ts-expect-error  web only type */}
            <View style={styles.header}>
                {/* @ts-expect-error  web only type */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity onPress={() => setActiveTab('Online')}>
                        <Text
                            style={[
                                styles.tabItem,
                                // @ts-expect-error web only type
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
                                // @ts-expect-error web only type
                                activeTab === 'All' && styles.activeTab,
                            ]}
                        >
                            All
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.tabItem}>Pending</Text>
                    {/* Add more tabs if needed */}
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
                isLargeScreen &&
                activeTab === 'AddFriends' && <AddFriendsScreen />
            ) : (
                <View style={styles.friendsListArea}>
                    <FlatList
                        data={filteredFriends}
                        keyExtractor={(item) => item.id}
                        renderItem={renderFriendItem}
                    />
                </View>
            )}
        </View>
    );
};

const styles = {
    container: {
        flex: 1,
        backgroundColor: COLORS.SecondaryBackground, // Discord-like dark background
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
        color: '#FFFFFF',
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
        color: '#FFFFFF',
    },
    friendsListArea: {
        flex: 1,
        padding: 8,
    },
    friendName: {
        fontWeight: 'bold',
        fontFamily: 'Roboto_700Bold',
        color: COLORS.White,
        marginBottom: 4,
    },
    friendStatus: {
        color: '#B9BBBE',
        fontSize: 12,
    },
    friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.SecondaryBackground,
        marginVertical: 4,
        borderRadius: 4,
        padding: 12,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16, // circular
        marginRight: 8,
    },
    friendDetails: {
        flex: 1, // so it expands and pushes friendAction to the right
        justifyContent: 'center',
    },
    friendAction: {
        marginLeft: 8,
    },
    avatarAndDot: {
        position: 'relative',
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
        borderColor: '#2F3136', // matches background
    },
};
