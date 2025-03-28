'use client';

import React, { useEffect, useContext } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'solito/navigation';
import { ActiveGroupContext } from '@shared-ui/providers';

export const dynamic = 'force-dynamic'; // Forces server-side rendering

export const DashboardIndexPage: React.FC = () => {
    const router = useRouter();
    // Get active group from context (if any)
    const { activeGroup } = useContext(ActiveGroupContext);

    useEffect(() => {
        // If an active group exists, navigate to that group's page.
        if (activeGroup) {
            // Assuming group names are URL-safe; otherwise, use a slug.
            router.replace(`/dashboard/${activeGroup.name.toLowerCase()}`);
        } else {
            // If no active group, navigate to a default screen (e.g., Friends)
            router.replace('/dashboard/friends');
        }
    }, [activeGroup, router]);

    return (
        <View style={{ padding: 20 }}>
            <Text style={{ color: 'white' }}>Loading dashboard...</Text>
        </View>
    );
};

export default DashboardIndexPage;
