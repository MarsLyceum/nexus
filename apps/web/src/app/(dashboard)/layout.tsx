// app/dashboard/layout.tsx

import '../../../polyfills/expo-polyfills.js';
import React from 'react';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { redirect } from 'next/navigation';

import { createApolloClient } from 'shared-ui/utils';
import { FETCH_USER_GROUPS_QUERY } from 'shared-ui/queries';
import type { UserGroupsType } from 'shared-ui/redux';
import type { User } from 'shared-ui/types';

import { JWT_SECRET } from '../../../config';

import { DashboardLayoutClient } from './DashboardLayoutClient';

export const revalidate = 0;

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Read the token cookie from the request headers
    const cookieStore = await cookies();

    // pull both tokens
    const accessToken = cookieStore.get('access_token')?.value;
    const refreshToken = cookieStore.get('refresh_token')?.value;
    if (!accessToken) {
        redirect('/login');
    }
    // serialize exactly as the browser would send them
    const cookieHeader = [
        `access_token=${accessToken}`,
        refreshToken && `refresh_token=${refreshToken}`,
    ]
        .filter(Boolean)
        .join('; ');

    const client = createApolloClient(cookieHeader);

    let decodedToken;
    try {
        // Verify and decode the token using your JWT secret
        decodedToken = jwt.verify(accessToken, JWT_SECRET as string) as {
            id: string;
            email: string;
            // include additional claims if needed
        };
    } catch (error) {
        console.error('Failed to verify token cookie:', error);
        return <div>Error: Invalid token.</div>;
    }

    // Construct a minimal user object from the token payload
    const user: User = {
        id: decodedToken.id,
        email: decodedToken.email,
        // These fields may be populated later or left empty:
        username: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        groups: [],
        status: 'offline', // Default status; adjust as needed
    };

    // Query user groups using the user.id extracted from the token
    const response = await client.query<{ fetchUserGroups: UserGroupsType }>({
        query: FETCH_USER_GROUPS_QUERY,
        variables: { userId: user.id },
    });
    const groups = response.data.fetchUserGroups;

    return (
        <DashboardLayoutClient groups={groups}>
            {children}
        </DashboardLayoutClient>
    );
}
