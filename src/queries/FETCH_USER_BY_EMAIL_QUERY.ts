import { gql } from '@apollo/client';

export const FETCH_USER_BY_EMAIL_QUERY = gql`
    query FetchUserByEmail($email: String!) {
        fetchUserByEmail(email: $email) {
            id
            email
            username
            firstName
            lastName
            phoneNumber
        }
    }
`;
