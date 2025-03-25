import { gql } from '@apollo/client';

export const ACCEPT_FRIEND_REQUEST = gql`
    mutation AcceptFriendRequest($friendId: String!) {
        acceptFriendRequest(friendId: $friendId) {
            id
        }
    }
`;
