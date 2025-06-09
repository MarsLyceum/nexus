// TextChannelScreen.tsx
import React from 'react';
import { View, useWindowDimensions } from 'react-native';

import { useAppSelector, RootState, UserType } from '../redux';
import { Header, MediaDetailsModal } from '../sections';
import { useTheme } from '../theme';
import { GroupChannel, Attachment } from '../types';
import { MessageList, ChatInputContainer } from '../small-components';
import {
    useTextChannelMessages,
    useSendMessage,
    useImageDetailsModal,
} from '../hooks';

export type TextChannelScreenProps = {
    channel: GroupChannel;
};

export const TextChannelScreen: React.FC<TextChannelScreenProps> = ({
    channel,
}) => {
    const user: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;
    const {
        modalVisible,
        modalAttachments,
        modalInitialIndex,
        closeImagePreview,
        handleInlineImagePress,
        handleAttachmentPreviewPress,
        handleMessageItemAttachmentPress,
    } = useImageDetailsModal();
    const { theme } = useTheme();

    // Custom hook to fetch messages
    const {
        chatMessages,
        loadingMessages,
        loadMoreMessages,
        refreshMessages,
        addMessage,
        deleteMessage,
    } = useTextChannelMessages(channel.id);

    // Custom hook to send messages
    const sendMsg = useSendMessage(addMessage);

    // onSend callback for ChatInputContainer
    const handleSend = async (text: string, attachments: Attachment[]) => {
        await sendMsg(
            user?.username ?? '',
            user?.id ?? '',
            channel.id,
            text,
            attachments,
            refreshMessages
        );
    };

    return (
        <View
            style={{
                flex: 1,
                flexBasis: 0,
                backgroundColor: theme.colors.SecondaryBackground,
            }}
        >
            <Header isLargeScreen={isLargeScreen} headerText={channel.name} />

            <View style={{ flex: 1 }}>
                <MessageList
                    chatMessages={chatMessages}
                    loadingMessages={loadingMessages}
                    width={width}
                    loadMoreMessages={loadMoreMessages}
                    onAttachmentPress={handleMessageItemAttachmentPress}
                    onDeleteMessage={deleteMessage}
                />
            </View>

            <ChatInputContainer
                onSend={handleSend}
                recipientName={`#${channel.name}`}
                onInlineImagePress={handleInlineImagePress}
                onAttachmentPreviewPress={handleAttachmentPreviewPress}
            />

            <MediaDetailsModal
                visible={modalVisible}
                attachments={modalAttachments}
                initialIndex={modalInitialIndex}
                onClose={closeImagePreview}
            />
        </View>
    );
};
