import { gql } from '@apollo/client';

export const DELETE_TEXT_CHANNEL_MESSAGE = gql`
    mutation DeleteTextChannelMessage($id: String!, $postedByUserId: String!) {
        deleteTextChannelMessage(id: $id, postedByUserId: $postedByUserId)
    }
`;
