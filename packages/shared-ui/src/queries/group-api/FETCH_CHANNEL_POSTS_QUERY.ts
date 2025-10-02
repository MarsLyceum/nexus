import { gql } from '@apollo/client';

export const FETCH_CHANNEL_POSTS_QUERY = gql`
    query GetFeedChannelPosts($channelId: String!, $offset: Int, $limit: Int) {
        getFeedChannelPosts(
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
