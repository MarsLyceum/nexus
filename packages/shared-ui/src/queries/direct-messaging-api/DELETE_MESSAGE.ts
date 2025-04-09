import { gql } from '@apollo/client';

export const DELETE_MESSAGE = gql`
    mutation DeleteMessage($messageId: String!) {
        deleteMessage(messageId: $messageId)
    }
`;
