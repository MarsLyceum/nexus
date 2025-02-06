import { gql } from '@apollo/client';

export const CREATE_GROUP_CHANNEL_POST_MUTATION = gql`
    mutation CreateGroupChannelMessage(
        $postedByUserId: String!
        $channelId: String!
        $content: String!
        $title: String!
    ) {
        createGroupChannelMessage(
            postedByUserId: $postedByUserId
            channelId: $channelId
            content: $content
            title: $title
            messageType: "post"
        ) {
            content
        }
    }
`;
