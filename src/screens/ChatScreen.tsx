import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GiftedChat } from 'react-native-gifted-chat';
import Icon from 'react-native-vector-icons/FontAwesome5';

export const ChatScreen = ({ route, navigation }) => {
    const { user } = route.params || { user: { name: 'Unknown' } }; // Default user if no params exist

    const [messages, setMessages] = useState([]);

    const onSend = (newMessages = []) => {
        setMessages((prevMessages) =>
            GiftedChat.append(prevMessages, newMessages)
        );
    };

    if (!route.params || !route.params.user) {
        return (
            <View style={styles.chatContainer}>
                <Text style={styles.chatTitle}>No user selected.</Text>
            </View>
        );
    }

    return (
        <View style={styles.chatContainer}>
            <View style={styles.chatHeader}>
                <Icon
                    name="arrow-left"
                    size={20}
                    color="white"
                    onPress={() => navigation.goBack()}
                />
                <Text style={styles.chatTitle}>{user.name}</Text>
            </View>
            <GiftedChat
                messages={messages}
                onSend={(messages) => onSend(messages)}
                user={{
                    _id: 1,
                    name: 'You',
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    chatContainer: {
        flex: 1,
        backgroundColor: '#23272A',
    },
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2C2F33',
        padding: 15,
    },
    chatTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginLeft: 10,
    },
});
