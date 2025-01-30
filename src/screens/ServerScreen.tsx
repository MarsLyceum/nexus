import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

const Stack = createStackNavigator();

// **Channel List**
const channels = [
    { id: '1', name: 'general', active: true },
    { id: '2', name: 'references', active: false },
    { id: '3', name: 'shopping', active: false },
    { id: '4', name: 'events', active: false },
    { id: '5', name: 'character creation', active: false },
];

const ChannelList = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.serverTitle}>The Traveler Campaign</Text>
            <FlatList
                data={channels}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.channelItem}
                        onPress={() =>
                            navigation.navigate('Chat', { channel: item.name })
                        }
                    >
                        <Icon
                            name="comment"
                            size={16}
                            color={item.active ? 'white' : 'gray'}
                            style={styles.icon}
                        />
                        <Text
                            style={[
                                styles.channelText,
                                item.active && styles.activeChannel,
                            ]}
                        >
                            {item.name}
                        </Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
};

// **Chat Messages**
const messages = [
    {
        id: '1',
        user: 'Sarge',
        time: '01/24/2025 9:50 AM',
        text: 'Game still ago?',
        avatar: 'https://source.unsplash.com/50x50/?man,avatar',
    },
    {
        id: '2',
        user: 'hakeem',
        time: '01/24/2025 9:59 AM',
        text: 'Probably, I’ll be attending a wedding so the game will have to start later than usual by anywhere from 30 to 60 minutes, might even run something else',
        avatar: 'https://source.unsplash.com/50x50/?abstract,avatar',
    },
    {
        id: '3',
        user: 'DC - Pierre',
        time: '01/24/2025 10:21 AM',
        text: 'if you’re attending a wedding you don’t want to give it a miss this week and go enjoy yourself? I’m sure everyone would understand, RL comes first right?',
        avatar: 'https://source.unsplash.com/50x50/?dragon,avatar',
        edited: true,
    },
];

const ChatScreen = ({ route, navigation }) => {
    const { channel } = route.params;
    const [messageText, setMessageText] = useState('');

    return (
        <View style={styles.container}>
            {/* Header with Back Button & Channel Name */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Icon name="arrow-left" size={20} color="white" />
                </TouchableOpacity>
                <Text style={styles.channelName}># {channel}</Text>
            </View>

            {/* Chat Messages */}
            <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.messageContainer}>
                        <Image
                            source={{ uri: item.avatar }}
                            style={styles.avatar}
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

            {/* Message Input */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder={`Message #${channel}`}
                    placeholderTextColor="gray"
                    value={messageText}
                    onChangeText={setMessageText}
                />
            </View>
        </View>
    );
};

// **Stack Navigator**
export function ServerScreen() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Channels" component={ChannelList} />
            <Stack.Screen name="Chat" component={ChatScreen} />
        </Stack.Navigator>
    );
}

// **Styles**
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2C1C3D',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#4A3A5A',
    },
    backButton: {
        marginRight: 10,
    },
    channelName: {
        fontSize: 18,
        color: 'white',
        fontWeight: 'bold',
    },
    serverTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 20,
        paddingLeft: 20,
    },
    channelItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingLeft: 20,
    },
    icon: {
        marginRight: 10,
    },
    channelText: {
        fontSize: 16,
        color: 'gray',
    },
    activeChannel: {
        color: 'white',
        fontWeight: 'bold',
    },
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 15,
    },
    avatar: {
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
    inputContainer: {
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#4A3A5A',
        backgroundColor: '#1A1124',
    },
    input: {
        backgroundColor: '#3A2A4A',
        color: 'white',
        padding: 10,
        borderRadius: 20,
        fontSize: 14,
    },
});

export default ServerScreen;
