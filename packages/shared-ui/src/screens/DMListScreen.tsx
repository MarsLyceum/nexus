import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    useWindowDimensions,
    FlatList,
} from 'react-native';

import { NexusImage } from '../small-components';
import { useNexusRouter } from '../hooks';
import { COLORS } from '../constants';
import { ChatScreen } from './ChatScreen';

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

export const DMListScreen: React.FC = () => {
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;
    const [selectedUser, setSelectedUser] = useState<
        (typeof users)[0] | undefined
    >(isLargeScreen ? users[0] : undefined);
    const router = useNexusRouter();

    // When switching to large screens, ensure we have a selected user.
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
            router.push('/chat', {
                id: user.id,
                name: user.name,
                avatar: user.avatar,
            });
        }
    };

    return (
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
                            <NexusImage
                                source={item.avatar || '/default-avatar.png'}
                                alt="avatar"
                                width={40}
                                height={40}
                                style={styles.avatar}
                                contentFit="cover"
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
                    {/* Pass selectedUser as userOverride so ChatScreen uses it instead of URL params */}
                    <ChatScreen userOverride={selectedUser} />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: COLORS.PrimaryBackground,
        height: '100%',
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
