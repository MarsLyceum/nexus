import { gql } from '@apollo/client';

export const DELETE_TEXT_CHANNEL_MESSAGE = gql`
    mutation DeleteTextChannelMessage($id: String!) {
        deleteTextChannelMessage(id: $id)
    }
`;
