import { gql } from '@apollo/client';

export const REGISTER_USER_MUTATION = gql`
    mutation RegisterUser(
        $email: String!
        $password: String!
        $firstName: String!
        $lastName: String!
        $age: Int!
    ) {
        registerUser(
            email: $email
            password: $password
            firstName: $firstName
            lastName: $lastName
            age: $age
        ) {
            id
            email
            firstName
            lastName
            age
            token
        }
    }
`;
