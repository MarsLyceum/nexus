import { gql } from '@apollo/client';

export const CREATE_CONVERSATION = gql`
    mutation CreateConversation(
        $type: ConversationType!
        $participantsUserIds: [String!]!
        $channelId: String
    ) {
        createConversation(
            type: $type
            participantsUserIds: $participantsUserIds
            channelId: $channelId
        ) {
            id
            type
            participantsUserIds
            channelId
        }
    }
`;
