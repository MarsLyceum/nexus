import React, { useRef } from 'react';
import { StyleSheet, FlatList } from 'react-native';
import { MessageWithAvatar } from '../types';
import { MessageItemSkeleton } from './MessageItemSkeleton';
import { MessageItem } from './MessageItem';

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
    // Create a ref for the FlatList scroll container.
    const flatListRef = useRef<FlatList>(null);

    if (loadingMessages) {
        return (
            <FlatList
                ref={flatListRef}
                data={[0, 1, 2, 3, 4]}
                keyExtractor={(item) => item.toString()}
                renderItem={() => <MessageItemSkeleton width={width} />}
                style={styles.container}
            />
        );
    }

    return (
        <FlatList
            ref={flatListRef}
            data={chatMessages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <MessageItem
                    message={item}
                    width={width}
                    onAttachmentPress={onAttachmentPress}
                    scrollContainerRef={flatListRef} // Pass the scroll container ref
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
