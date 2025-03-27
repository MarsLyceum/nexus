// MessageList.tsx
import React from 'react';
import { StyleSheet, FlatList } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { MessageWithAvatar } from '../types';
import { MessageItem } from './MessageItem';
import { PatchedFlashList } from './PatchedFlashList';
import { MessageItemSkeleton } from './MessageItemSkeleton';
import { NexusList } from './NexusList';

export type MessageListProps = {
    chatMessages: MessageWithAvatar[];
    loadingMessages: boolean;
    width: number;
    loadMoreMessages: () => void;
    onAttachmentPress: (attachments: string[], index: number) => void;
};

export const MessageList: React.FC<MessageListProps> = ({
    chatMessages,
    loadingMessages,
    width,
    loadMoreMessages,
    onAttachmentPress,
}) => {
    if (loadingMessages) {
        return (
            <FlatList
                data={[0, 1, 2, 3, 4]}
                keyExtractor={(item) => item.toString()}
                renderItem={() => <MessageItemSkeleton width={width} />}
                style={styles.container}
            />
        );
    }

    return (
        <FlatList
            data={chatMessages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <MessageItem
                    item={item}
                    width={width}
                    onAttachmentPress={onAttachmentPress}
                />
            )}
            style={styles.container}
            inverted
            onEndReached={loadMoreMessages}
            onEndReachedThreshold={0.1}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexShrink: 1,
        flexBasis: 0,
        paddingBottom: 80,
    },
});
