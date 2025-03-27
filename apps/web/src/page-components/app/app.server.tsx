// apps/web/pages/AppDrawerScreen.server.tsx
import React from 'react';
import { FriendsScreen } from '@shared-ui/src/screens';

import { BaseAppScreen } from './base-app';

// In the server version, we supply defaults.
export const AppScreenServer: React.FC = () => {
    const isDesktop = true; // Assume desktop for SSR
    const sidebarOpen = true; // Always show sidebar by default on SSR
    const simulatedNavigation = {
        navigate: (screenName: string) => {},
        toggleDrawer: () => {},
    };
    const ActiveComponent = FriendsScreen; // Default active screen

    return (
        <BaseAppScreen
            isDesktop={isDesktop}
            sidebarOpen={sidebarOpen}
            toggleSidebar={() => {}}
            simulatedNavigation={simulatedNavigation}
            ActiveComponent={ActiveComponent}
        />
    );
};
