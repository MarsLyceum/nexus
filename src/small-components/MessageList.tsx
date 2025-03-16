// MessageList.tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { MessageWithAvatar } from '../types';
import { MessageItem } from './MessageItem';
import { PatchedFlashList } from './PatchedFlashList';

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
            <FlashList
                data={[0, 1, 2, 3, 4]}
                keyExtractor={(item) => item.toString()}
                renderItem={() => null}
                style={styles.container}
                estimatedItemSize={100}
            />
        );
    }

    return (
        <PatchedFlashList
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
            estimatedItemSize={100}
            inverted
            onEndReached={loadMoreMessages}
            onEndReachedThreshold={0.1}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: 80,
    },
});
