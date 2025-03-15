// MessageList.tsx
import React, { useRef, useEffect } from 'react';
import {
    StyleSheet,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { MessageWithAvatar } from '../types';
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

    // Ensure messages are in chronological order (oldest first, newest last).
    // If chatMessages is sorted newest-first, reverse it:
    const orderedMessages = [...chatMessages].reverse();

    const flashListRef = useRef<FlashList<MessageWithAvatar>>(null);
    const initialScrollDone = useRef(false);
    const loadingOlder = useRef(false);
    const scrollOffsetRef = useRef(0);
    const prevOrderedMessagesRef = useRef<MessageWithAvatar[]>([]);

    // On mount, scroll to the bottom (only once).
    useEffect(() => {
        if (!initialScrollDone.current && orderedMessages.length > 0) {
            setTimeout(() => {
                flashListRef.current?.scrollToIndex({
                    index: orderedMessages.length - 1,
                    animated: false,
                });
                initialScrollDone.current = true;
            }, 100);
        }
    }, [orderedMessages]);

    // Auto-scroll when a new (latest) message is appended.
    useEffect(() => {
        if (!initialScrollDone.current) return;
        if (prevOrderedMessagesRef.current.length === 0) {
            prevOrderedMessagesRef.current = orderedMessages;
            return;
        }
        const prevLast =
            prevOrderedMessagesRef.current[
                prevOrderedMessagesRef.current.length - 1
            ];
        const currentLast = orderedMessages[orderedMessages.length - 1];
        if (prevLast.id !== currentLast.id) {
            flashListRef.current?.scrollToIndex({
                index: orderedMessages.length - 1,
                animated: true,
            });
        }
        prevOrderedMessagesRef.current = orderedMessages;
    }, [orderedMessages]);

    // onScroll: update the current scroll offset.
    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
    };

    // When scrolling ends, if near the top, trigger loadMoreMessages.
    const handleScrollEnd = (
        event: NativeSyntheticEvent<NativeScrollEvent>
    ) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        if (offsetY < 20 && !loadingOlder.current) {
            loadingOlder.current = true;
            loadMoreMessages();
            setTimeout(() => {
                loadingOlder.current = false;
            }, 1000);
        }
    };

    // Periodic check: if the scroll offset is near the top (idle), trigger loadMoreMessages.
    useEffect(() => {
        const interval = setInterval(() => {
            if (scrollOffsetRef.current < 20 && !loadingOlder.current) {
                loadingOlder.current = true;
                loadMoreMessages();
                setTimeout(() => {
                    loadingOlder.current = false;
                }, 1000);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [loadMoreMessages]);

    return (
        <FlashList
            ref={flashListRef}
            data={orderedMessages}
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
            onScroll={handleScroll}
            onMomentumScrollEnd={handleScrollEnd}
            onScrollEndDrag={handleScrollEnd}
            scrollEventThrottle={16}
            initialScrollIndex={orderedMessages.length - 1}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: 80,
    },
});
