import { gql } from '@apollo/client';

export const DELETE_FEED_CHANNEL_POST = gql`
    mutation DeleteFeedChannelPost($id: String!, $postedByUserId: String!) {
        deleteFeedChannelPost(id: $id, postedByUserId: $postedByUserId)
    }
`;
