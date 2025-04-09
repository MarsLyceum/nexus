import { gql } from '@apollo/client';

export const UPDATE_USER = gql`
    mutation UpdateUser(
        $id: String!
        $email: String
        $username: String
        $firstName: String
        $lastName: String
        $phoneNumber: String
        $status: UserOnlineStatus
    ) {
        updateUser(
            id: $id
            email: $email
            username: $username
            firstName: $firstName
            lastName: $lastName
            phoneNumber: $phoneNumber
            status: $status
        ) {
            id
            email
            username
            firstName
            lastName
            phoneNumber
            status
        }
    }
`;
