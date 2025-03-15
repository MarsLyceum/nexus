// MessageList.tsx
import React, { useRef, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
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
            <Virtuoso
                data={[0, 1, 2, 3, 4]}
                itemContent={(_index, _item) => <SkeletonMessageItem />}
                style={styles.container}
            />
        );
    }

    // Reverse messages so that oldest is first, newest is last.
    const orderedMessages = [...chatMessages].reverse();
    const virtuosoRef = useRef<VirtuosoHandle>(null);

    // On mount or when orderedMessages change, scroll to the newest message.
    useEffect(() => {
        if (orderedMessages.length && virtuosoRef.current) {
            virtuosoRef.current.scrollToIndex({
                index: orderedMessages.length - 1,
                align: 'end',
                behavior: 'auto',
            });
        }
    }, [orderedMessages]);

    return (
        <Virtuoso
            ref={virtuosoRef}
            data={orderedMessages}
            followOutput
            // Load older messages when the user scrolls to the top.
            startReached={loadMoreMessages}
            itemContent={(_index, item) => (
                <MessageItem
                    item={item}
                    width={width}
                    onAttachmentPress={onAttachmentPress}
                />
            )}
            style={styles.container}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        paddingBottom: 80,
    },
});
