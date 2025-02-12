import { gql } from '@apollo/client';

export const FETCH_POST_QUERY = gql`
    query FetchPost($postId: String!) {
        fetchPost(id: $postId) {
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
