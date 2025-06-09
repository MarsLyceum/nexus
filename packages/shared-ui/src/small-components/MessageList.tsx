import React, { useRef, useCallback } from 'react';
import { StyleSheet, FlatList } from 'react-native';
import { useMutation } from '@apollo/client';

import { MessageWithAvatar, DirectMessageWithAvatar } from '../types';
import { UPDATE_TEXT_CHANNEL_MESSAGE } from '../queries';
import { useAppSelector, RootState, UserType } from '../redux';

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
    const [updateTextChannelMessage] = useMutation(UPDATE_TEXT_CHANNEL_MESSAGE);
    const activeUser: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );

    const handleSaveEdit = useCallback(
        (message: DirectMessageWithAvatar | MessageWithAvatar) => {
            updateTextChannelMessage({
                variables: {
                    id: message.id,
                    content: message.content,
                    postedByUserId: activeUser?.id,
                },
                optimisticResponse: {
                    updateTextChannelMessage: {
                        id: message.id,
                        content: message.content,
                        __typename: 'TextChannelMessage',
                    },
                },
            }).catch((error) => {
                console.error('Error updating message:', error);
            });
        },
        [activeUser?.id, updateTextChannelMessage]
    );

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
                    scrollContainerRef={flatListRef}
                    onSaveEdit={handleSaveEdit}
                    onDeleteMessage={() => {}}
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
