import { gql } from '@apollo/client';

export const FETCH_POST_COMMENTS_QUERY = gql`
    query FetchPostComments(
        $postId: String!
        $parentCommentId: String
        $offset: Int
        $limit: Int
    ) {
        fetchPostComments(
            postId: $postId
            parentCommentId: $parentCommentId
            offset: $offset
            limit: $limit
        ) {
            id
            content
            postedAt
            edited
            postedByUserId
            postId
            parentCommentId
            upvotes
            hasChildren
            attachmentUrls
            children {
                id
                content
                postedAt
                edited
                postedByUserId
                postId
                parentCommentId
                upvotes
                hasChildren
                attachmentUrls
                children {
                    id
                    content
                    postedAt
                    edited
                    postedByUserId
                    postId
                    parentCommentId
                    upvotes
                    hasChildren
                    attachmentUrls
                    children {
                        id
                        content
                        postedAt
                        edited
                        postedByUserId
                        postId
                        parentCommentId
                        upvotes
                        hasChildren
                        attachmentUrls
                        children {
                            id
                            content
                            postedAt
                            edited
                            postedByUserId
                            postId
                            parentCommentId
                            upvotes
                            hasChildren
                            attachmentUrls
                            children {
                                id
                                content
                                postedAt
                                edited
                                postedByUserId
                                postId
                                parentCommentId
                                upvotes
                                hasChildren
                                attachmentUrls
                                children {
                                    id
                                    content
                                    postedAt
                                    edited
                                    postedByUserId
                                    postId
                                    parentCommentId
                                    upvotes
                                    hasChildren
                                    attachmentUrls
                                    children {
                                        id
                                        content
                                        postedAt
                                        edited
                                        postedByUserId
                                        postId
                                        parentCommentId
                                        upvotes
                                        hasChildren
                                        attachmentUrls
                                        children {
                                            id
                                            content
                                            postedAt
                                            edited
                                            postedByUserId
                                            postId
                                            parentCommentId
                                            upvotes
                                            hasChildren
                                            attachmentUrls
                                            children {
                                                id
                                                content
                                                postedAt
                                                edited
                                                postedByUserId
                                                postId
                                                parentCommentId
                                                upvotes
                                                hasChildren
                                                attachmentUrls
                                                children {
                                                    id
                                                    content
                                                    postedAt
                                                    edited
                                                    postedByUserId
                                                    postId
                                                    parentCommentId
                                                    upvotes
                                                    hasChildren
                                                    attachmentUrls
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
