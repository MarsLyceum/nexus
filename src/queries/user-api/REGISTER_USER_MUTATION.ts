import { gql } from '@apollo/client';

export const REGISTER_USER_MUTATION = gql`
    mutation RegisterUser(
        $email: String!
        $password: String!
        $username: String!
        $firstName: String!
        $lastName: String!
        $phoneNumber: String!
    ) {
        registerUser(
            email: $email
            password: $password
            username: $username
            firstName: $firstName
            lastName: $lastName
            phoneNumber: $phoneNumber
        ) {
            id
            email
            username
            firstName
            lastName
            phoneNumber
            status
            token
        }
    }
`;
