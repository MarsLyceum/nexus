import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Platform,
    useWindowDimensions,
} from 'react-native';
import { NavigationProp, RouteProp } from '@react-navigation/core';
import { Image as ExpoImage } from 'expo-image';
import Icon from 'react-native-vector-icons/FontAwesome5';

import { COLORS } from '../constants';
import { ChatInput } from '../small-components';
import { Attachment } from '../types';
import { useFileUpload } from '../hooks';

// Define the Message type
export type Message = {
    id: string;
    user: string;
    time: string;
    text: string;
    avatar: string;
    edited: boolean;
};

// Define the type for navigation parameters
type RootStackParamList = {
    ChatScreen: {
        user: {
            name: string;
            avatar: string;
        };
    };
};

type ChatScreenProps = {
    navigation: NavigationProp<RootStackParamList, 'ChatScreen'>;
    route: RouteProp<RootStackParamList, 'ChatScreen'>;
};

// Detect if the device is a mobile or tablet
const isMobileOrTablet = Platform.OS === 'ios' || Platform.OS === 'android';

const styles = StyleSheet.create({
    chatContainer: {
        flex: 1,
        backgroundColor: COLORS.SecondaryBackground,
    },
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.SecondaryBackground,
        borderColor: COLORS.InactiveText,
        borderBottomWidth: 1,
        padding: 15,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginLeft: 10,
    },
    chatTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginLeft: 10,
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

export const ChatScreen: React.FC<ChatScreenProps> = ({
    route,
    navigation,
}) => {
    const { user } = route.params || { user: { name: 'Unknown', avatar: '' } };
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;

    // Initialize messages with an explicit Message type.
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            user: 'CaptCrunch',
            time: '01/22/2025 7:12 AM',
            text: 'Its free on Steam atm if you want to install it ahead of time',
            avatar: 'https://picsum.photos/50?random=1',
            edited: false,
        },
        {
            id: '2',
            user: 'Milheht',
            time: '01/22/2025 7:12 AM',
            text: "Ok cool I'll install it then",
            avatar: 'https://picsum.photos/50?random=2',
            edited: false,
        },
        {
            id: '3',
            user: 'CaptCrunch',
            time: '01/25/2025 11:32 PM',
            text: 'Do you like PoE2 by the way?',
            avatar: 'https://picsum.photos/50?random=1',
            edited: true,
        },
        {
            id: '4',
            user: 'CaptCrunch',
            time: '01/25/2025 11:35 PM',
            text: "He's been really caught up in other things besides games though so I wouldn't hold my breath on him joining, but maybe I can twist his arm lol",
            avatar: 'https://picsum.photos/50?random=1',
            edited: false,
        },
        {
            id: '5',
            user: 'Milheht',
            time: '01/26/2025 7:31 AM',
            text: "Yeah I like PoE2 but it's really difficult and I'm currently stuck on a boss. It would be fun to play it sometime though.",
            avatar: 'https://picsum.photos/50?random=2',
            edited: false,
        },
    ]);

    const [messageText, setMessageText] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const flatListRef = useRef<FlatList<Message>>(null);

    // Use file upload hook for handling image upload
    const { pickFile } = useFileUpload();

    // Updated handleImageUpload function using useFileUpload hook.
    const handleImageUpload = async () => {
        const file = await pickFile();
        if (file) {
            let previewUri = '';
            if ('uri' in file) {
                previewUri = file.uri;
            } else {
                previewUri = URL.createObjectURL(file);
            }
            const newAttachment: Attachment = {
                id: `${Date.now()}-${Math.random()}`,
                file,
                previewUri,
            };
            setAttachments((prev) => [...prev, newAttachment]);
        }
    };

    // Function to send a message using the new ChatInput component
    const sendMessageHandler = () => {
        if (!messageText.trim() && attachments.length === 0) return;

        const newMessage: Message = {
            id: Math.random().toString(),
            user: 'You',
            time: new Date().toLocaleString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            }),
            text: messageText,
            avatar: 'https://picsum.photos/50?random=99',
            edited: false,
        };

        setMessages((prevMessages) => [...prevMessages, newMessage]);
        setMessageText('');
        setAttachments([]);
    };

    // Handlers for inline image and attachment preview presses
    const onInlineImagePress = (url: string) => {
        console.log('Inline image pressed:', url);
    };

    const onAttachmentPreviewPress = (att: Attachment) => {
        console.log('Attachment preview pressed:', att);
    };

    // Scroll to the bottom whenever messages change.
    useEffect(() => {
        if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
        }
    }, [messages]);

    return (
        <View style={styles.chatContainer}>
            {/* Chat Header */}
            <View style={styles.chatHeader}>
                {!isLargeScreen && (
                    <Icon.Button
                        name="arrow-left"
                        size={20}
                        backgroundColor={COLORS.SecondaryBackground}
                        onPress={() => navigation.goBack()}
                    />
                )}
                <ExpoImage
                    source={{ uri: user.avatar }}
                    style={styles.headerAvatar}
                />
                <Text style={styles.chatTitle}>{user.name}</Text>
            </View>

            {/* Chat Messages */}
            <FlatList<Message>
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.messageContainer}>
                        <ExpoImage
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

            {/* Chat Input using the ChatInput component */}
            <ChatInput
                messageText={messageText}
                setMessageText={setMessageText}
                attachments={attachments}
                setAttachments={setAttachments}
                handleImageUpload={handleImageUpload}
                sendMessageHandler={sendMessageHandler}
                recipientName={user.name}
                onInlineImagePress={onInlineImagePress}
                onAttachmentPreviewPress={onAttachmentPreviewPress}
            />
        </View>
    );
};
