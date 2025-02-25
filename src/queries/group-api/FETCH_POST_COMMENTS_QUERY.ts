import { gql } from '@apollo/client';

export const FETCH_POST_COMMENTS_QUERY = gql`
    query FetchPostComments($postId: String!, $offset: Int, $limit: Int) {
        fetchPostComments(postId: $postId, offset: $offset, limit: $limit) {
            id
            content
            postedAt
            edited
            postedByUserId
            postId
            parentCommentId
            upvotes
            children {
                id
                content
                postedAt
                edited
                postedByUserId
                postId
                parentCommentId
                upvotes
                children {
                    id
                    content
                    postedAt
                    edited
                    postedByUserId
                    postId
                    parentCommentId
                    upvotes
                    children {
                        id
                        content
                        postedAt
                        edited
                        postedByUserId
                        postId
                        parentCommentId
                        upvotes
                        children {
                            id
                            content
                            postedAt
                            edited
                            postedByUserId
                            postId
                            parentCommentId
                            upvotes
                            children {
                                id
                                content
                                postedAt
                                edited
                                postedByUserId
                                postId
                                parentCommentId
                                upvotes
                                children {
                                    id
                                    content
                                    postedAt
                                    edited
                                    postedByUserId
                                    postId
                                    parentCommentId
                                    upvotes
                                    children {
                                        id
                                        content
                                        postedAt
                                        edited
                                        postedByUserId
                                        postId
                                        parentCommentId
                                        upvotes
                                        children {
                                            id
                                            content
                                            postedAt
                                            edited
                                            postedByUserId
                                            postId
                                            parentCommentId
                                            upvotes
                                            children {
                                                id
                                                content
                                                postedAt
                                                edited
                                                postedByUserId
                                                postId
                                                parentCommentId
                                                upvotes
                                                children {
                                                    id
                                                    content
                                                    postedAt
                                                    edited
                                                    postedByUserId
                                                    postId
                                                    parentCommentId
                                                    upvotes
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
`;
