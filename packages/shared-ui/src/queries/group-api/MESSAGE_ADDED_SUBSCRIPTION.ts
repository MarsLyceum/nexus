import { gql } from '@apollo/client';

export const MESSAGE_ADDED_SUBSCRIPTION = gql`
    subscription MessageAdded($channelId: String!) {
        messageAdded(channelId: $channelId) {
            id
            content
            channelId
            postedAt
            postedByUserId
            edited
            attachmentUrls
        }
    }
`;
