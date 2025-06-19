// useCreatePost.ts
import { useMutation } from '@apollo/client';
import {
    UPDATE_FEED_CHANNEL_POST,
    GET_FEED_CHANNEL_POSTS_QUERY,
} from '../queries';

type UpdatePostVariables = {
    id: string;
    postedByUserId: string;
    channelId: string;
    content: string;
    title: string;
};

export const useUpdatePost = (
    channelId: string | undefined,
    onCompletedCallback?: () => void
) => {
    const [updatePostMutation, { loading: updatingPost }] = useMutation(
        UPDATE_FEED_CHANNEL_POST,
        {
            context: {
                headers: {
                    'x-apollo-operation-name': 'UpdateFeedChannelPost',
                },
            },
            refetchQueries: [
                {
                    query: GET_FEED_CHANNEL_POSTS_QUERY,
                    variables: { channelId, offset: 0, limit: 100 },
                },
            ],
            awaitRefetchQueries: true,
            onCompleted: onCompletedCallback,
            onError: (error) => {
                console.error('Error updating post:', error);
            },
        }
    );

    const updatePost = async (variables: UpdatePostVariables) => {
        console.log('channelId:', channelId);
        if (!channelId) return;
        console.log('updating post...');
        await updatePostMutation({ variables });
    };

    return { updatePost, updatingPost };
};
