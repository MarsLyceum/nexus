import { gql } from '@apollo/client';

export const SEND_MESSAGE = gql`
    mutation SendMessage(
        $conversationId: String!
        $id: String!
        $content: String!
        $senderUserId: String!
    ) {
        sendMessage(
            conversationId: $conversationId
            id: $id
            content: $content
            senderUserId: $senderUserId
        ) {
            id
        }
    }
`;
