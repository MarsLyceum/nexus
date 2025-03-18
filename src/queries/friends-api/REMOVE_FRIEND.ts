import { gql } from '@apollo/client';

export const REMOVE_FRIEND = gql`
    mutation RemoveFriend($friendId: String!) {
        removeFriend(friendId: $friendId)
    }
`;
