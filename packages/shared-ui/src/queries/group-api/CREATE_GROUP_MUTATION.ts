import { gql } from '@apollo/client';

export const CREATE_GROUP_MUTATION = gql`
    mutation CreateGroup(
        $name: String!
        $createdByUserId: String!
        $publicGroup: Boolean!
        $avatar: Upload!
    ) {
        createGroup(
            name: $name
            createdByUserId: $createdByUserId
            publicGroup: $publicGroup
            avatar: $avatar
        ) {
            name
        }
    }
`;
