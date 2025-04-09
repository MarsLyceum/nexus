import { gql } from '@apollo/client';

export const GET_CONVERSATION_MESSAGES = gql`
    query GetConversationMessages(
        $conversationId: String!
        $offset: Int!
        $limit: Int!
    ) {
        getConversationMessages(
            conversationId: $conversationId
            offset: $offset
            limit: $limit
        ) {
            id
            content
            senderUserId
            createdAt
            edited
            attachmentUrls
        }
    }
`;
