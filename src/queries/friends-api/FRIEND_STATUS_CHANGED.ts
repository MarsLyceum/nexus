import { gql } from '@apollo/client';

export const FRIEND_STATUS_CHANGED = gql`
    subscription FriendStatusChanged($userId: String!) {
        friendStatusChanged(userId: $userId) {
            friendUserId
            status
        }
    }
`;
