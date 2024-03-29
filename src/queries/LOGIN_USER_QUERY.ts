import { gql } from '@apollo/client';

export const LOGIN_USER_QUERY = gql`
    query LoginUser($email: String!, $password: String!) {
        loginUser(email: $email, password: $password) {
            id
            email
            firstName
            lastName
            age
            token
        }
    }
`;
