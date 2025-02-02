import { gql } from '@apollo/client';

export const FETCH_USER_GROUPS_QUERY = gql`
    query FetchUserGroups($email: String!) {
        fetchUserGroups(email: $email) {
            id
            name
            createdByUserEmail
            createdAt
            description
            members {
                userEmail
                groupId
                role
                joinedAt
            }
            channels {
                id
                name
                type
                createdAt
                groupId
            }
        }
    }
`;
