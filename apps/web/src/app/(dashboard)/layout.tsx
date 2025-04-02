// app/dashboard/layout.tsx

import '../../../polyfills/expo-polyfills.js';
import React from 'react';
import { createApolloClient } from '@shared-ui/utils';
import { FETCH_USER_GROUPS_QUERY } from '@shared-ui/queries';
import type { UserGroupsType } from '@shared-ui/redux';

import { DashboardLayoutClient } from './DashboardLayoutClient';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Create Apollo Client and fetch groups on the server.
    const client = createApolloClient();

    // Replace with your actual logic for retrieving the user id.
    const userId = '40ff5be6-d2bb-4fe1-98ae-6cfb01fe5a6c';

    const response = await client.query<{ fetchUserGroups: UserGroupsType }>({
        query: FETCH_USER_GROUPS_QUERY,
        variables: { userId },
    });
    const groups = response.data.fetchUserGroups;

    return (
        <DashboardLayoutClient groups={groups}>
            {children}
        </DashboardLayoutClient>
    );
}
