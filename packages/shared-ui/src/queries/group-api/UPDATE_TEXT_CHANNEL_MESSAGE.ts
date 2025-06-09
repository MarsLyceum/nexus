import { gql } from '@apollo/client';

export const UPDATE_TEXT_CHANNEL_MESSAGE = gql`
    mutation UpdateTextChannelMessage(
        $id: String!
        $postedByUserId: String!
        $content: String!
    ) {
        updateTextChannelMessage(
            id: $id
            postedByUserId: $postedByUserId
            content: $content
        ) {
            content
        }
    }
`;
