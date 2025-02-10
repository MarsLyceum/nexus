import { gql } from '@apollo/client';

export const FETCH_CHANNEL_POSTS_QUERY = gql`
    query FetchChannelMessage($channelId: String!, $offset: Int) {
        fetchFeedPosts: fetchChannelMessages(
            channelId: $channelId
            offset: $offset
        ) {
            id
            content
            postedAt
            edited
            channelId
            postedByUserId
            messageType
            ... on PostMessage {
                title
                flair
                domain
                thumbnail
                upvotes
                commentsCount
                shareCount
            }
        }
    }
`;
