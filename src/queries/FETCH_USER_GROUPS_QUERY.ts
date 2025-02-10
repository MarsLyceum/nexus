import { gql } from '@apollo/client';

export const FETCH_USER_GROUPS_QUERY = gql`
    query FetchUserGroups($userId: String!) {
        fetchUserGroups(userId: $userId) {
            id
            name
            createdByUserId
            createdAt
            description
            avatarFilePath
            members {
                userId
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
