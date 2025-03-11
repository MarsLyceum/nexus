// TextChannelScreen.tsx
import React, { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { NavigationProp } from '@react-navigation/core';
import { useAppSelector, RootState, UserType } from '../redux';
import { Header, LargeImageModal } from '../sections';
import { COLORS } from '../constants';
import { GroupChannel, Attachment } from '../types';
import { MessageList, ChatInputContainer } from '../small-components';
import { useChannelMessages, useSendMessage } from '../hooks';

export type TextChannelScreenProps = {
    channel: GroupChannel;
    navigation: NavigationProp<Record<string, unknown>>;
};

export const TextChannelScreen: React.FC<TextChannelScreenProps> = ({
    channel,
    navigation,
}) => {
    const user: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;

    // Modal state for image previews
    const [modalVisible, setModalVisible] = useState(false);
    const [modalAttachments, setModalAttachments] = useState<string[]>([]);
    const [modalInitialIndex, setModalInitialIndex] = useState(0);

    // Custom hook to fetch messages
    const {
        chatMessages,
        loadingMessages,
        loadMoreMessages,
        refreshMessages,
        addMessage,
    } = useChannelMessages(channel.id);

    // Custom hook to send messages
    const sendMsg = useSendMessage(addMessage);

    // Handler for inline image preview tap
    const handleInlineImagePress = (url: string) => {
        setModalAttachments([url]);
        setModalInitialIndex(0);
        setModalVisible(true);
    };

    // Handler for attachment preview tap from ChatInput
    const handleAttachmentPreviewPress = (att: Attachment) => {
        setModalAttachments([att.previewUri]);
        setModalInitialIndex(0);
        setModalVisible(true);
    };

    // Handler for tapping an attachment inside a MessageItem
    const handleMessageItemAttachmentPress = (
        _attachments: string[],
        index: number
    ) => {
        setModalAttachments(_attachments);
        setModalInitialIndex(index);
        setModalVisible(true);
    };

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
        <View style={{ flex: 1, backgroundColor: COLORS.SecondaryBackground }}>
            <Header
                isLargeScreen={isLargeScreen}
                headerText={channel.name}
                navigation={navigation}
            />

            <MessageList
                chatMessages={chatMessages}
                loadingMessages={loadingMessages}
                width={width}
                loadMoreMessages={loadMoreMessages}
                onAttachmentPress={handleMessageItemAttachmentPress}
            />

            <ChatInputContainer
                onSend={handleSend}
                recipientName={`#${channel.name}`}
                onInlineImagePress={handleInlineImagePress}
                onAttachmentPreviewPress={handleAttachmentPreviewPress}
            />

            <LargeImageModal
                visible={modalVisible}
                attachments={modalAttachments}
                initialIndex={modalInitialIndex}
                onClose={() => setModalVisible(false)}
            />
        </View>
    );
};
