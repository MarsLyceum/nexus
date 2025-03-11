import { gql } from '@apollo/client';

export const REGISTER_USER_MUTATION = gql`
    mutation RegisterUser(
        $email: String!
        $username: String!
        $firstName: String!
        $lastName: String!
        $phoneNumber: String!
    ) {
        registerUser(
            email: $email
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
        }
    }
`;
