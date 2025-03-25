import { gql } from '@apollo/client';

export const CREATE_GROUP_CHANNEL_MESSAGE_MUTATION = gql`
    mutation CreateGroupChannelMessage(
        $id: String
        $postedByUserId: String!
        $channelId: String!
        $content: String!
        $attachments: [Upload!]
    ) {
        createGroupChannelMessage(
            id: $id
            postedByUserId: $postedByUserId
            channelId: $channelId
            content: $content
            messageType: "message"
            attachments: $attachments
        ) {
            content
        }
    }
`;
