import { gql } from '@apollo/client';

export const CREATE_GROUP_CHANNEL_MESSAGE_MUTATION = gql`
    mutation CreateGroupChannelMessage(
        $postedByUserId: String!
        $channelId: String!
        $content: String!
    ) {
        createGroupChannelMessage(
            postedByUserId: $postedByUserId
            channelId: $channelId
            content: $content
            messageType: "message"
        ) {
            content
        }
    }
`;
