// useCreatePost.ts
import { useMutation } from '@apollo/client';
import {
    CREATE_GROUP_CHANNEL_POST_MUTATION,
    FETCH_CHANNEL_POSTS_QUERY,
} from '../queries';
import { AttachmentFile } from '../types';

type CreatePostVariables = {
    postedByUserId: string;
    channelId: string;
    content: string;
    title: string;
    attachments: AttachmentFile[];
};

export const useCreatePost = (
    channelId: string | undefined,
    onCompletedCallback?: () => void
) => {
    const [createPostMutation, { loading: creatingPost }] = useMutation(
        CREATE_GROUP_CHANNEL_POST_MUTATION,
        {
            context: {
                headers: {
                    'x-apollo-operation-name': 'CreateMessage',
                },
            },
            refetchQueries: [
                {
                    query: FETCH_CHANNEL_POSTS_QUERY,
                    variables: { channelId, offset: 0, limit: 100 },
                },
            ],
            awaitRefetchQueries: true,
            onCompleted: onCompletedCallback,
            onError: (error) => {
                console.error('Error creating post:', error);
            },
        }
    );

    const createPost = async (variables: CreatePostVariables) => {
        if (!channelId) return;
        await createPostMutation({ variables });
    };

    return { createPost, creatingPost };
};
