import { gql } from '@apollo/client';

export const CREATE_TEXT_CHANNEL_MESSAGE_MUTATION = gql`
    mutation CreateTextChannelMessage(
        $id: String
        $postedByUserId: String!
        $channelId: String!
        $content: String!
        $attachments: [Upload!]
    ) {
        createTextChannelMessage(
            id: $id
            postedByUserId: $postedByUserId
            channelId: $channelId
            content: $content
            attachments: $attachments
        ) {
            content
        }
    }
`;
