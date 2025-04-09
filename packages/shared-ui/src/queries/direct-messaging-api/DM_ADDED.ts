import { gql } from '@apollo/client';

export const DM_ADDED = gql`
    subscription DmAdded($conversationId: String!) {
        dmAdded(conversationId: $conversationId) {
            id
            content
            senderUserId
            createdAt
            edited
            attachmentUrls
        }
    }
`;
