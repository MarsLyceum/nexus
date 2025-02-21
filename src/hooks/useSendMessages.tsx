import { Keyboard } from 'react-native';
import { useApolloClient } from '@apollo/client';
import { CREATE_GROUP_CHANNEL_MESSAGE_MUTATION } from '../queries';

export const useSendMessage = () => {
    const apolloClient = useApolloClient();

    const sendMessage = async (
        userId: string,
        channelId: string,
        messageText: string,
        attachments: { file: any }[],
        refreshMessages: () => void
    ) => {
        if (!messageText.trim() && attachments.length === 0) return;
        try {
            const cappedAttachments = attachments.slice(0, 10);
            const attachmentsArray = cappedAttachments.map((att) => att.file);

            await apolloClient.mutate({
                mutation: CREATE_GROUP_CHANNEL_MESSAGE_MUTATION,
                variables: {
                    postedByUserId: userId,
                    channelId,
                    content: messageText.trim(),
                    attachments: attachmentsArray,
                },
                context: {
                    headers: {
                        'x-apollo-operation-name': 'CreateMessage',
                    },
                },
            });
            Keyboard.dismiss();
            refreshMessages();
        } catch (error) {
            console.error('Error creating message:', error);
        }
    };

    return sendMessage;
};
