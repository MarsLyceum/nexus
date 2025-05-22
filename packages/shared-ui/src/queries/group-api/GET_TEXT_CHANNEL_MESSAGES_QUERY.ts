import { gql } from '@apollo/client';

export const GET_TEXT_CHANNEL_MESSAGES_QUERY = gql`
    query GetTextChannelMessages(
        $channelId: String!
        $offset: Int
        $limit: Int
    ) {
        getTextChannelMessages(
            channelId: $channelId
            offset: $offset
            limit: $limit
        ) {
            id
            content
            postedAt
            edited
            channelId
            postedByUserId
            attachmentUrls
        }
    }
`;
