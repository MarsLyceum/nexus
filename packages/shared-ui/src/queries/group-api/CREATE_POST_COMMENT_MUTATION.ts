import { gql } from '@apollo/client';

export const CREATE_POST_COMMENT_MUTATION = gql`
    # input CreatePostCommentInput {
    #   content: String!
    #   postedByUserId: String!
    #   postId: String!
    #   parentCommentId: String
    #   upvotes: Int
    #   # If you need nested children input, recursively reference the same input type.
    #   children: [CreatePostCommentInput]
    # }

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
