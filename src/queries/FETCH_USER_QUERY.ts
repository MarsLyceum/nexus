import { gql } from '@apollo/client';

export const FETCH_USER_QUERY = gql`
    query FetchUser($email: String!) {
        fetchUser(email: $email) {
            id
            email
            firstName
            lastName
            phoneNumber
        }
    }
`;
