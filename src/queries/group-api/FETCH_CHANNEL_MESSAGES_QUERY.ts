import { gql } from '@apollo/client';

export const FETCH_CHANNEL_MESSAGES_QUERY = gql`
    query FetchChannelMessages($channelId: String!, $offset: Int) {
        fetchChannelMessages(channelId: $channelId, offset: $offset) {
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
