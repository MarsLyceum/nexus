import { gql } from '@apollo/client';

export const UPDATE_MESSAGE = gql`
    mutation UpdateMessage(
        $conversationId: String!
        $id: String!
        $content: String!
        $senderUserId: String!
    ) {
        updateMessage(
            conversationId: $conversationId
            id: $id
            content: $content
            senderUserId: $senderUserId
        ) {
            id
            content
        }
    }
`;
