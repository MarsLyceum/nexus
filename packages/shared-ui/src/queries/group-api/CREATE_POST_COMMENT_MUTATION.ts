import { gql } from '@apollo/client';

export const CREATE_POST_COMMENT_MUTATION = gql`
    mutation CreatePostComment(
        $postedByUserId: String!
        $postId: String!
        $content: String!
        $attachments: [Upload!]
        $parentCommentId: String
        $hasChildren: Boolean!
        $upvotes: Int!
    ) {
        createPostComment(
            postedByUserId: $postedByUserId
            content: $content
            attachments: $attachments
            postId: $postId
            parentCommentId: $parentCommentId
            hasChildren: $hasChildren
            upvotes: $upvotes
        ) {
            content
        }
    }
`;
