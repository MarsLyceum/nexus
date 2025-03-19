import { gql } from '@apollo/client';

export const GET_FRIENDS = gql`
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
                status
            }
            requestedBy {
                id
                email
                username
                firstName
                lastName
                phoneNumber
                status
            }
        }
    }
`;
