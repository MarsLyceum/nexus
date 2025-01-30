import React, { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Image,
    useWindowDimensions,
} from 'react-native';

import { COLORS } from '../constants';

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

const ChatScreen = ({ selectedUser }) => {
    if (!selectedUser) return <View style={styles.emptyChat} />;

    return (
        <View style={styles.chatContainer}>
            <View style={styles.header}>
                <Image
                    source={{ uri: selectedUser.avatar }}
                    style={styles.headerAvatar}
                />
                <Text style={styles.headerTitle}>{selectedUser.name}</Text>
            </View>

            <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.messageContainer}>
                        <Image
                            source={{ uri: item.avatar }}
                            style={styles.messageAvatar}
                        />
                        <View style={styles.messageContent}>
                            <Text style={styles.userName}>
                                {item.user}{' '}
                                <Text style={styles.time}>{item.time}</Text>
                            </Text>
                            <Text style={styles.messageText}>{item.text}</Text>
                            {item.edited && (
                                <Text style={styles.editedLabel}>(edited)</Text>
                            )}
                        </View>
                    </View>
                )}
            />
        </View>
    );
};

export const DMListScreen = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;
    const [selectedUser, setSelectedUser] = useState(null);

    const handleUserPress = (user) => {
        if (isLargeScreen) {
            setSelectedUser(user);
        } else {
            navigation.navigate('Chat', { user });
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.sidebar}>
                <View style={styles.dmHeader}>
                    <Text style={styles.dmTitle}>Messages</Text>
                </View>

                <FlatList
                    data={users}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.userItem}
                            onPress={() => handleUserPress(item)}
                        >
                            <Image
                                source={{ uri: item.avatar }}
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

            {isLargeScreen && <ChatScreen selectedUser={selectedUser} />}
        </View>
    );
};

// Sample Chat Messages
const messages = [
    {
        id: '1',
        user: 'CaptCrunch',
        time: '1/22/2025 7:12 AM',
        text: 'Its free on Steam atm if you want to install it ahead of time',
        avatar: 'https://picsum.photos/50?random=1',
    },
    {
        id: '2',
        user: 'Milheht',
        time: '1/22/2025 7:12 AM',
        text: "Ok cool I'll install it then",
        avatar: 'https://picsum.photos/50?random=2',
    },
    {
        id: '3',
        user: 'CaptCrunch',
        time: '1/25/2025 11:32 PM',
        text: 'Do you like PoE2 by the way? (edited)',
        avatar: 'https://picsum.photos/50?random=1',
    },
];

// **Styles**
const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
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
    chatContainer: {
        flex: 1,
        backgroundColor: COLORS.SecondaryBackground,
    },
    emptyChat: {
        flex: 1,
        backgroundColor: COLORS.SecondaryBackground,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#4A3A5A',
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 18,
        color: 'white',
        fontWeight: 'bold',
    },
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 15,
    },
    messageAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    messageContent: {
        flex: 1,
    },
    userName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'white',
    },
    time: {
        fontSize: 12,
        color: 'gray',
    },
    messageText: {
        fontSize: 14,
        color: 'white',
        marginTop: 2,
    },
    editedLabel: {
        fontSize: 12,
        color: 'gray',
        marginTop: 2,
    },
});

export default DMListScreen;
