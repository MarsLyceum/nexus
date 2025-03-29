import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
    SafeAreaView,
} from 'react-native';
import { SolitoImage } from 'solito/image';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useSearchParams } from 'solito/navigation';

import { useNexusRouter } from '../hooks';
import { COLORS } from '../constants';
import { Attachment } from '../types';
import { ChatInputContainer, NexusList } from '../small-components';

export type Message = {
    id: string;
    user: string;
    time: string;
    text: string;
    avatar: string;
    edited: boolean;
    attachments: Attachment[];
};

interface ChatScreenProps {
    userOverride?: {
        id?: string;
        name: string;
        avatar: string;
    };
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ userOverride }) => {
    const router = useNexusRouter();
    const params = useSearchParams<{ name?: string; avatar?: string }>();

    const user = userOverride || {
        name: params?.get('name') || 'Unknown',
        avatar: params?.get('avatar') || '',
    };

    const { width, height: windowHeight } = useWindowDimensions();
    const isLargeScreen = width > 768;

    // Approximate header and input heights.
    const headerHeight = 70;
    const inputHeight = 70;
    // Calculate available height for the messages list.
    const messagesHeight = windowHeight - (headerHeight + inputHeight);

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            user: 'CaptCrunch',
            time: '01/22/2025 7:12 AM',
            text: 'Its free on Steam atm if you want to install it ahead of time',
            avatar: 'https://picsum.photos/50?random=1',
            edited: false,
            attachments: [],
        },
        {
            id: '2',
            user: 'Milheht',
            time: '01/22/2025 7:12 AM',
            text: "Ok cool I'll install it then",
            avatar: 'https://picsum.photos/50?random=2',
            edited: false,
            attachments: [],
        },
        {
            id: '3',
            user: 'CaptCrunch',
            time: '01/25/2025 11:32 PM',
            text: 'Do you like PoE2 by the way?',
            avatar: 'https://picsum.photos/50?random=1',
            edited: true,
            attachments: [],
        },
        {
            id: '4',
            user: 'CaptCrunch',
            time: '01/25/2025 11:35 PM',
            text: "He's been really caught up in other things besides games though so I wouldn't hold my breath on him joining, but maybe I can twist his arm lol",
            avatar: 'https://picsum.photos/50?random=1',
            edited: false,
            attachments: [],
        },
        {
            id: '5',
            user: 'Milheht',
            time: '01/26/2025 7:31 AM',
            text: "Yeah I like PoE2 but it's really difficult and I'm currently stuck on a boss. It would be fun to play it sometime though.",
            avatar: 'https://picsum.photos/50?random=2',
            edited: false,
            attachments: [],
        },
    ]);

    const handleSend = (text: string, attachments: Attachment[]) => {
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
            text,
            avatar: 'https://picsum.photos/50?random=99',
            edited: false,
            attachments,
        };
        setMessages((prevMessages) => [...prevMessages, newMessage]);
    };

    const onInlineImagePress = (url: string) => {
        console.log('Inline image pressed:', url);
    };

    const onAttachmentPreviewPress = (att: Attachment) => {
        console.log('Attachment preview pressed:', att);
    };

    // Unified message renderer for both web and mobile.
    const renderItem = ({ item, index }: { item: Message; index: number }) => (
        <View key={item.id} style={styles.messageContainer}>
            <SolitoImage
                src={item.avatar}
                alt="avatar"
                width={40}
                height={40}
                style={styles.messageAvatar}
                contentFit="cover"
            />
            <View style={styles.messageContent}>
                <Text style={styles.userName}>
                    {item.user} <Text style={styles.time}>{item.time}</Text>
                </Text>
                <Text style={styles.messageText}>{item.text}</Text>
                {item.edited && (
                    <Text style={styles.editedLabel}>(edited)</Text>
                )}
                {item.attachments && item.attachments.length > 0 && (
                    <View style={styles.attachmentsContainer}>
                        {item.attachments.map((att, idx) => (
                            <TouchableOpacity
                                key={idx}
                                onPress={() => onAttachmentPreviewPress(att)}
                            >
                                <SolitoImage
                                    src={att.previewUri}
                                    alt="attachment"
                                    width={100}
                                    height={100}
                                    style={styles.attachmentImage}
                                    contentFit="cover"
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Chat Header */}
            <View style={styles.chatHeader}>
                {!isLargeScreen && (
                    <Icon.Button
                        name="arrow-left"
                        size={20}
                        backgroundColor={COLORS.SecondaryBackground}
                        onPress={() => router.back()}
                    />
                )}
                <SolitoImage
                    src={user.avatar || '/default-avatar.png'}
                    alt="avatar"
                    width={40}
                    height={40}
                    style={styles.headerAvatar}
                    contentFit="cover"
                />
                <Text style={styles.chatTitle}>{user.name}</Text>
            </View>

            {/* Main Content Area */}
            <View style={styles.mainContent}>
                {/* Messages List */}
                <View
                    style={[
                        styles.messagesContainer,
                        { height: messagesHeight },
                    ]}
                >
                    <NexusList
                        data={messages}
                        inverted={false}
                        estimatedItemSize={80}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                    />
                </View>

                {/* Chat Input */}
                <View style={styles.inputContainer}>
                    <ChatInputContainer
                        onSend={handleSend}
                        recipientName={user.name}
                        onInlineImagePress={onInlineImagePress}
                        onAttachmentPreviewPress={onAttachmentPreviewPress}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        height: '100vh', // Full viewport height
        flex: 1,
        backgroundColor: COLORS.SecondaryBackground,
        overflow: 'hidden',
    },
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.SecondaryBackground,
        borderBottomWidth: 1,
        borderColor: COLORS.InactiveText,
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
    mainContent: {
        flex: 1,
        flexDirection: 'column',
    },
    messagesContainer: {
        flex: 1,
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
    attachmentsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 5,
    },
    attachmentImage: {
        width: 100,
        height: 100,
        borderRadius: 10,
        marginTop: 5,
        marginRight: 5,
    },
    inputContainer: {
        height: 70, // Fixed height for chat input
    },
});
