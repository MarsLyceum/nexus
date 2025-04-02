'use client';

import '../../../polyfills/expo-polyfills.js';
import React, { useEffect, useContext } from 'react';
import { View, Text } from 'react-native';
import { useNexusRouter } from '@shared-ui/hooks';
import { ActiveGroupContext } from '@shared-ui/providers';

export const dynamic = 'force-dynamic'; // Forces server-side rendering

export const DashboardIndexPage: React.FC = () => {
    const router = useNexusRouter();
    // Get active group from context (if any)
    const { activeGroup } = useContext(ActiveGroupContext);

    useEffect(() => {
        // If an active group exists, navigate to that group's page.
        if (activeGroup) {
            // Assuming group names are URL-safe; otherwise, use a slug.
            router.replace(`/${activeGroup.name.toLowerCase()}`);
        } else {
            // If no active group, navigate to a default screen (e.g., Friends)
            router.replace('/friends');
        }
    }, [activeGroup, router]);

    return (
        <View style={{ padding: 20 }}>
            <Text style={{ color: 'white' }}>Loading dashboard...</Text>
        </View>
    );
};

export default DashboardIndexPage;
