import { gql } from '@apollo/client';

export const FETCH_USER_QUERY = gql`
    query FetchUser($userId: String!) {
        fetchUser(userId: $userId) {
            id
            email
            username
            firstName
            lastName
            phoneNumber
        }
    }
`;
