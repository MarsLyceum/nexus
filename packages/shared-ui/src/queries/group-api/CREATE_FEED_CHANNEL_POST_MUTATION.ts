import { gql } from '@apollo/client';

export const CREATE_FEED_CHANNEL_POST_MUTATION = gql`
    mutation CreateFeedChannelPost(
        $postedByUserId: String!
        $channelId: String!
        $content: String!
        $title: String!
        $attachments: [Upload!]
    ) {
        createFeedChannelPost(
            postedByUserId: $postedByUserId
            channelId: $channelId
            content: $content
            title: $title
            attachments: $attachments
        ) {
            content
        }
    }
`;
