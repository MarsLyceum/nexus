// MessageItem.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinkPreview } from './LinkPreview';
import { MessageWithAvatar } from '../types';

// Helper function to format date/time
const formatDateTime = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours() % 12 || 12;
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
};

export type MessageItemProps = {
    item: MessageWithAvatar;
    width: number;
    onAttachmentPress: (attachments: string[], index: number) => void;
};

export const MessageItem: React.FC<MessageItemProps> = ({
    item,
    width,
    onAttachmentPress,
}) => {
    // Render the message content: if the message is a URL, show a link preview.
    const renderMessageContent = (content: string) => {
        const isOnlyUrl = content.startsWith('http') && !content.includes(' ');
        return isOnlyUrl ? (
            <LinkPreview url={content} containerWidth={width - 32} />
        ) : (
            <Text style={styles.messageText}>{content}</Text>
        );
    };

    return (
        <View style={styles.messageContainer}>
            <ExpoImage source={{ uri: item.avatar }} style={styles.avatar} />
            <View style={styles.messageContent}>
                <Text style={styles.userName}>
                    {item.username}{' '}
                    <Text style={styles.time}>
                        {formatDateTime(item.postedAt)}
                    </Text>
                </Text>
                {item.content ? renderMessageContent(item.content) : null}
                {item.attachmentUrls && item.attachmentUrls.length > 0 && (
                    <View style={styles.messageAttachmentsContainer}>
                        {item.attachmentUrls.map((url, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() =>
                                    onAttachmentPress(
                                        item.attachmentUrls,
                                        index
                                    )
                                }
                            >
                                <ExpoImage
                                    source={{ uri: url }}
                                    style={styles.messageAttachmentImage}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 15,
        width: '100%',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    messageContent: {
        flex: 1,
        flexShrink: 1,
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
        flexWrap: 'wrap',
        flexShrink: 1,
    },
    messageAttachmentsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 5,
    },
    messageAttachmentImage: {
        width: 100,
        height: 100,
        marginRight: 5,
        marginTop: 5,
        borderRadius: 8,
    },
});
