import { gql } from '@apollo/client';

export const UPDATE_FEED_CHANNEL_POST = gql`
    mutation UpdateFeedChannelPost(
        $id: String!
        $postedByUserId: String!
        $channelId: String!
        $content: String!
        $title: String!
    ) {
        updateFeedChannelPost(
            id: $id
            postedByUserId: $postedByUserId
            channelId: $channelId
            content: $content
            title: $title
        ) {
            content
        }
    }
`;
