import { gql } from '@apollo/client';

export const GET_FRIENDS_QUERY = gql`
    query GetFriends($userId: String!) {
        getFriends(userId: $userId) {
            id
            status
            friend {
                id
                email
                username
                firstName
                lastName
                phoneNumber
            }
            requestedBy {
                id
                email
                username
                firstName
                lastName
                phoneNumber
            }
        }
    }
`;
