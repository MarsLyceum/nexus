import { gql } from '@apollo/client';

export const GET_FEED_CHANNEL_POSTS_QUERY = gql`
    query GetFeedChannelPosts($channelId: String!, $offset: Int, $limit: Int) {
        getFeedChannelPosts: getFeedChannelPosts(
            channelId: $channelId
            offset: $offset
            limit: $limit
        ) {
            id
            content
            postedAt
            edited
            channelId
            postedByUserId
            attachmentUrls
            title
            flair
            domain
            thumbnail
            upvotes
            commentsCount
            shareCount
        }
    }
`;
