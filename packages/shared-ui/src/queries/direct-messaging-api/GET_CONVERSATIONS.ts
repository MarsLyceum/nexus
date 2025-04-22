import { gql } from '@apollo/client';

export const GET_CONVERSATIONS = gql`
    query GetConversations($userId: String!) {
        getConversations(userId: $userId) {
            id
            type
            participantsUserIds
            closedByUserIds
            channelId
        }
    }
`;
