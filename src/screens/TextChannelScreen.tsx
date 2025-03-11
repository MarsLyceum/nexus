// TextChannelScreen.tsx
import React, { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { NavigationProp } from '@react-navigation/core';
import { useAppSelector, RootState, UserType } from '../redux';
import { Header, LargeImageModal } from '../sections';
import { COLORS } from '../constants';
import { GroupChannel, Attachment } from '../types';
import { MessageList, ChatInput } from '../small-components';
import { useFileUpload, useChannelMessages, useSendMessage } from '../hooks';

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
    const [messageText, setMessageText] = useState('');
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;
    const [attachments, setAttachments] = useState<Attachment[]>([]);

    // Modal state for image previews
    const [modalVisible, setModalVisible] = useState(false);
    const [modalAttachments, setModalAttachments] = useState<string[]>([]);
    const [modalInitialIndex, setModalInitialIndex] = useState(0);

    // Custom hook to fetch messages
    const { chatMessages, loadingMessages, loadMoreMessages, refreshMessages } =
        useChannelMessages(channel.id);

    // Custom hook to send messages
    const sendMsg = useSendMessage();

    // Modified sendMessageHandler accepts an optional override for messageText.
    const sendMessageHandler = async (overrideMessageText?: string) => {
        const textToSend =
            overrideMessageText !== undefined
                ? overrideMessageText
                : messageText;
        if (!textToSend.trim() && attachments.length === 0) return;
        await sendMsg(
            user?.id ?? '',
            channel.id,
            textToSend,
            attachments,
            refreshMessages
        );
        setMessageText('');
        setAttachments([]);
    };

    const { pickFile } = useFileUpload();

    const handleImageUpload = async () => {
        const file = await pickFile();
        if (file) {
            let previewUri = '';
            previewUri = 'uri' in file ? file.uri : URL.createObjectURL(file);
            const newAttachment: Attachment = {
                id: `${Date.now()}-${Math.random()}`,
                file,
                previewUri,
            };
            setAttachments((prev) => [...prev, newAttachment]);
        }
    };

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

            <ChatInput
                messageText={messageText}
                setMessageText={setMessageText}
                attachments={attachments}
                setAttachments={setAttachments}
                handleImageUpload={handleImageUpload}
                // Pass the modified sendMessageHandler which accepts an optional override
                sendMessageHandler={sendMessageHandler}
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
