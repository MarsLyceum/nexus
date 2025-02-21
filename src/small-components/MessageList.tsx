// MessageList.tsx
import React from 'react';
import { FlatList } from 'react-native';
import { MessageWithAvatar } from '../types';
import { MessageItem } from './MessageItem';
import { SkeletonMessageItem } from './SkeletonMessageItem';

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
                renderItem={() => <SkeletonMessageItem />}
                contentContainerStyle={{ paddingBottom: 80 }}
            />
        );
    }

    return (
        <FlatList
            data={[...chatMessages].reverse()}
            keyExtractor={(item) => item.id}
            onEndReached={loadMoreMessages}
            onEndReachedThreshold={0.1}
            renderItem={({ item }) => (
                <MessageItem
                    item={item}
                    width={width}
                    onAttachmentPress={onAttachmentPress}
                />
            )}
        />
    );
};
