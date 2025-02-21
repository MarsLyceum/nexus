import React, { useState, useEffect } from 'react';
import { NavigationProp } from '@react-navigation/core';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    useWindowDimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';

import { COLORS } from '../constants';
import { ChatScreen } from './ChatScreen';

// **Define the type for navigation parameters**
type RootStackParamList = {
    ChatScreen: {
        user: {
            id: string;
            name: string;
            avatar: string;
            subText?: string;
        };
    };
    // Add other routes and their params here if necessary
};

// **Define the props interface for DMListScreen**
interface DMListScreenProps {
    navigation: NavigationProp<RootStackParamList, 'ChatScreen'>;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: COLORS.PrimaryBackground,
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
        color: 'gray',
        fontWeight: 'bold',
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    selectedUserItem: {
        backgroundColor: COLORS.SecondaryBackground,
        borderRadius: 5,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    userName: {
        fontSize: 14,
        color: 'white',
    },
    subText: {
        fontSize: 12,
        color: 'gray',
    },
    chatWrapper: {
        flex: 1,
        backgroundColor: COLORS.PrimaryBackground,
    },
});

const users = [
    {
        id: '1',
        name: 'CaptCrunch',
        avatar: 'https://picsum.photos/50?random=1',
    },
    {
        id: '2',
        name: 'Milheht',
        avatar: 'https://picsum.photos/50?random=2',
    },
    {
        id: '3',
        name: 'Alex Spills The Beans',
        avatar: 'https://picsum.photos/50?random=3',
    },
    {
        id: '4',
        name: 'Mal, izme',
        avatar: 'https://picsum.photos/50?random=4',
        subText: '3 Members',
    },
    {
        id: '5',
        name: 'AngryFluffyMoth',
        avatar: 'https://picsum.photos/50?random=5',
        subText: '😭 UOHH!! PITS AND TITS!!',
    },
];

export const DMListScreen: React.FC<DMListScreenProps> = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;
    const [selectedUser, setSelectedUser] = useState<
        (typeof users)[0] | undefined
    >(isLargeScreen ? users[0] : undefined);

    // When switching to large screens, ensure we have a selected user
    useEffect(() => {
        if (isLargeScreen && !selectedUser) {
            setSelectedUser(users[0]);
        }
    }, [isLargeScreen, selectedUser]);

    const handleUserPress = (user: {
        id: string;
        name: string;
        avatar: string;
        subText?: string;
    }) => {
        if (isLargeScreen) {
            setSelectedUser(user);
        } else {
            // On small screens, navigate to the Chat screen
            navigation.navigate('ChatScreen', { user });
        }
    };

    return (
        // Root container with flex:1 and backgroundColor
        <View style={styles.container}>
            {/* Sidebar DM List */}
            <View style={styles.sidebar}>
                <View style={styles.dmHeader}>
                    <Text style={styles.dmTitle}>Messages</Text>
                </View>

                <FlatList
                    data={users}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.userItem,
                                selectedUser?.id === item.id &&
                                    styles.selectedUserItem,
                            ]}
                            onPress={() => handleUserPress(item)}
                        >
                            <ExpoImage
                                source={{ uri: item.avatar }}
                                // Ensure the path to your default avatar is correct
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, global-require, unicorn/prefer-module
                                defaultSource={require('../../assets/default-avatar.png')}
                                style={styles.avatar}
                                resizeMode="cover"
                            />
                            <View>
                                <Text style={styles.userName}>{item.name}</Text>
                                {item.subText && (
                                    <Text style={styles.subText}>
                                        {item.subText}
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* On large screens, show the chat to the right */}
            {isLargeScreen && selectedUser && (
                <View style={styles.chatWrapper}>
                    <ChatScreen
                        navigation={navigation}
                        route={{
                            key: `ChatScreen-${selectedUser.id}`, // Unique key for each chat
                            name: 'ChatScreen',
                            params: { user: selectedUser },
                        }}
                    />
                </View>
            )}
        </View>
    );
};
