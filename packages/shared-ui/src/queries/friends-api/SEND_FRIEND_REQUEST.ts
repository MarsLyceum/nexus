import { gql } from '@apollo/client';

export const SEND_FRIEND_REQUEST = gql`
    mutation SendFriendRequest($userId: String!, $friendUserId: String!) {
        sendFriendRequest(userId: $userId, friendUserId: $friendUserId) {
            id
        }
    }
`;
