// apps/web/pages/AppDrawerScreen.client.tsx
'use client';

import React, { useContext, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { useAppSelector, RootState, UserGroupsType } from '@shared-ui/redux';
import { ActiveGroupContext } from '@shared-ui/providers';
import {
    FriendsScreen,
    DMListScreen,
    EventsScreen,
    SearchScreen,
    GroupScreen,
} from '@shared-ui/src/screens';
import { BaseAppScreen } from './base-app';

export const AppScreenClient: React.FC = () => {
    // Get user groups from Redux.
    const userGroups: UserGroupsType = useAppSelector(
        (state: RootState) => state.userGroups.userGroups
    );

    // Determine if we're on desktop (width > 768).
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;

    // For mobile, control sidebar open/closed state.
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Simulated navigation state: active screen and active group.
    const [activeScreen, setActiveScreen] = useState<string>('Friends');
    const [activeGroup, setActiveGroupState] = useState<any>(null);
    const { setActiveGroup } = useContext(ActiveGroupContext);

    // Define fixed routes and their corresponding components.
    const routes = [
        { name: 'Friends', component: FriendsScreen },
        { name: 'Messages', component: DMListScreen },
        { name: 'Events', component: EventsScreen },
        { name: 'Search', component: SearchScreen },
    ];

    // Navigation functions.
    const handleNavigation = (screenName: string) => {
        setActiveScreen(screenName);
        if (!isDesktop) {
            setSidebarOpen(false);
        }
    };

    const handleGroupPress = (group: any) => {
        setActiveGroup(group);
        setActiveGroupState(group);
        setActiveScreen(group.name);
        if (!isDesktop) {
            setSidebarOpen(false);
        }
    };

    // Determine which component to render based on activeScreen.
    let ActiveComponent: React.ComponentType<any> | null = null;
    const fixedRoute = routes.find((route) => route.name === activeScreen);
    if (fixedRoute) {
        ActiveComponent = fixedRoute.component;
    } else if (activeGroup) {
        ActiveComponent = GroupScreen;
    }

    // Simulated navigation object for SidebarScreen.
    const simulatedNavigation = {
        navigate: (screenName: string) => {
            if (routes.find((route) => route.name === screenName)) {
                handleNavigation(screenName);
            } else if (screenName === 'CreateGroup') {
                handleNavigation('CreateGroup');
            } else {
                const group = userGroups.find((g) => g.name === screenName);
                if (group) {
                    handleGroupPress(group);
                }
            }
        },
        toggleDrawer: () => {
            setSidebarOpen(!sidebarOpen);
        },
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        <BaseAppScreen
            isDesktop={isDesktop}
            sidebarOpen={sidebarOpen}
            toggleSidebar={toggleSidebar}
            simulatedNavigation={simulatedNavigation}
            ActiveComponent={ActiveComponent}
        />
    );
};
