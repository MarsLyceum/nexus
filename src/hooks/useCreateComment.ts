// useCreatePost.ts
import { useMutation } from '@apollo/client';
import { CREATE_POST_COMMENT_MUTATION } from '../queries';
import { AttachmentFile } from '../types';

type CreateCommentVariables = {
    postedByUserId: string;
    postId: string;
    content: string;
    attachments: AttachmentFile[];
    parentCommentId: string;
    hasChildren: boolean;
    children: CreateCommentVariables[];
    upvotes: number;
};

export const useCreateComment = (onCompletedCallback?: () => void) => {
    const [createCommentMutation, { loading: creatingComment }] = useMutation(
        CREATE_POST_COMMENT_MUTATION,
        {
            context: {
                headers: {
                    'x-apollo-operation-name': 'CreateMessage',
                },
            },
            onCompleted: onCompletedCallback,
            onError: (error) => {
                console.error('Error creating comment:', error);
            },
        }
    );

    const createComment = async (variables: CreateCommentVariables) => {
        await createCommentMutation({ variables });
    };

    return { createComment, creatingComment };
};
