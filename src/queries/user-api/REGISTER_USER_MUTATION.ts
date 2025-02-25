import { gql } from '@apollo/client';

export const REGISTER_USER_MUTATION = gql`
    mutation RegisterUser(
        $email: String!
        $firstName: String!
        $lastName: String!
        $phoneNumber: String!
    ) {
        registerUser(
            email: $email
            firstName: $firstName
            lastName: $lastName
            phoneNumber: $phoneNumber
        ) {
            id
            email
            firstName
            lastName
            phoneNumber
        }
    }
`;
