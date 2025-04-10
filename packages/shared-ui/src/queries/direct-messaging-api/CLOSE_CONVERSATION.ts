import { gql } from '@apollo/client';

export const CLOSE_CONVERSATION = gql`
    mutation CloseConversation(
        $conversationId: String!
        $closedByUserId: String!
    ) {
        closeConversation(
            conversationId: $conversationId
            closedByUserId: $closedByUserId
        )
    }
`;
