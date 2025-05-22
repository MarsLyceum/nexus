import { Keyboard } from 'react-native';
import { useApolloClient } from '@apollo/client';
import { v4 as uuidv4 } from 'uuid';
import { CREATE_TEXT_CHANNEL_MESSAGE_MUTATION } from '../queries';
import { Attachment, MessageWithAvatar } from '../types';

export const useSendMessage = (
    addMessage: (msg: MessageWithAvatar) => void
) => {
    const apolloClient = useApolloClient();

    const sendMessage = async (
        username: string,
        userId: string,
        channelId: string,
        messageText: string,
        attachments: Attachment[],
        refreshMessages: () => void
    ) => {
        if (!messageText.trim() && attachments.length === 0) return;
        try {
            const cappedAttachments = attachments.slice(0, 10);
            const attachmentsArray = cappedAttachments.map((att) => att.file);
            const messageId = uuidv4();

            // Create an optimistic message that mirrors the server's expected response.
            const optimisticMessage: MessageWithAvatar = {
                id: messageId,
                username,
                postedByUserId: userId,
                channelId,
                content: messageText.trim(),
                postedAt: new Date(), // Stored as Date for local state
                avatar: 'https://picsum.photos/50?random=10',
                edited: false,
                // Optionally include additional fields such as username if available.
            };

            // Immediately update the local state with the optimistic message.
            addMessage(optimisticMessage);

            await apolloClient.mutate({
                mutation: CREATE_TEXT_CHANNEL_MESSAGE_MUTATION,
                variables: {
                    id: messageId,
                    postedByUserId: userId,
                    channelId,
                    content: messageText.trim(),
                    attachments: attachmentsArray,
                },
                // Provide an optimistic response for completeness.
                optimisticResponse: {
                    __typename: 'Mutation',
                    createTextChannelMessage: {
                        __typename: 'TextChannelMessage',
                        ...optimisticMessage,
                        postedAt: new Date().toISOString(),
                        attachmentUrls: attachmentsArray,
                    },
                },
                // Removed Apollo cache update logic – local state is updated via addMessage.
                context: {
                    headers: {
                        'x-apollo-operation-name': 'CreateTextChannelMessage',
                    },
                },
            });
            Keyboard.dismiss();
            refreshMessages();
        } catch (error) {
            console.error('Error creating message:', error);
            // Optionally: Remove or flag the optimistic message from local state if the mutation fails.
        }
    };

    return sendMessage;
};
