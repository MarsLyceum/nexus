import { gql } from '@apollo/client';

export const SEARCH_FOR_USERS_QUERY = gql`
    query SearchForUsers($searchQuery: String!) {
        searchForUsers(searchQuery: $searchQuery) {
            id
            email
            username
            firstName
            lastName
            phoneNumber
        }
    }
`;
