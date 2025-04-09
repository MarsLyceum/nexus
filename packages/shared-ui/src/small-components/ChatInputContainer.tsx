// ChatInputContainer.tsx
import React, { useState, useRef } from 'react';
import { ChatInput } from './ChatInput';
import { Attachment } from '../types';
import { useFileUpload } from '../hooks';

export type ChatInputContainerProps = {
    /** Callback to handle sending the message.
     * It receives the text and attachments.
     */
    onSend: (text: string, attachments: Attachment[]) => Promise<void> | void;
    recipientName: string;
    onInlineImagePress: (url: string) => void;
    onAttachmentPreviewPress: (att: Attachment) => void;
};

export const ChatInputContainer: React.FC<ChatInputContainerProps> = ({
    onSend,
    recipientName,
    onInlineImagePress,
    onAttachmentPreviewPress,
}) => {
    // Manage text state with a ref to keep in sync.
    const [messageText, setMessageText] = useState('');
    const messageTextRef = useRef('');
    const updateMessageText = (text: string) => {
        messageTextRef.current = text;
        setMessageText(text);
    };

    // Attachments state.
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const { pickFile } = useFileUpload();

    // Image upload handler.
    const handleImageUpload = async () => {
        const file = await pickFile();
        if (file) {
            const previewUri =
                'uri' in file ? file.uri : URL.createObjectURL(file);
            const newAttachment: Attachment = {
                id: `${Date.now()}-${Math.random()}`,
                file,
                previewUri,
            };
            setAttachments((prev) => [...prev, newAttachment]);
        }
    };

    // Send message handler.
    const sendMessageHandler = async (overrideMessageText?: string) => {
        const textToSend =
            overrideMessageText !== undefined
                ? overrideMessageText
                : messageTextRef.current;
        if (!textToSend.trim() && attachments.length === 0) return;

        // Save attachments before clearing.
        const attachmentsCopy = attachments;
        // Clear the inputs.
        messageTextRef.current = '';
        setMessageText('');
        setAttachments([]);

        // Call the parent's send handler.
        await onSend(textToSend, attachmentsCopy);
    };

    return (
        <ChatInput
            messageText={messageText}
            setMessageText={updateMessageText}
            attachments={attachments}
            setAttachments={setAttachments}
            handleImageUpload={handleImageUpload}
            sendMessageHandler={sendMessageHandler}
            recipientName={recipientName}
            onInlineImagePress={onInlineImagePress}
            onAttachmentPreviewPress={onAttachmentPreviewPress}
        />
    );
};
