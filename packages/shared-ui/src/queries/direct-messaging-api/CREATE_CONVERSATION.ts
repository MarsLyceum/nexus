import { gql } from '@apollo/client';

export const CREATE_CONVERSATION = gql`
    mutation CreateConversation(
        $type: ConversationType!
        $participantsUserIds: [String!]!
        $channelId: String
        $requestedByUserId: String!
    ) {
        createConversation(
            type: $type
            participantsUserIds: $participantsUserIds
            channelId: $channelId
            requestedByUserId: $requestedByUserId
        ) {
            id
            type
            participantsUserIds
            channelId
        }
    }
`;
