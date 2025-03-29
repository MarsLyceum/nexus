// app/dashboard/DashboardLayoutClient.tsx

'use client';

import '../../../polyfills/expo-polyfills';
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useNexusRouter } from '@shared-ui/hooks';
import { SidebarScreen } from '@shared-ui/screens';
import { COLORS, SIDEBAR_WIDTH } from '@shared-ui/constants';
import {
    UserGroupsType,
    retrieveUserGroups,
    useAppDispatch,
} from '@shared-ui/redux';

type DashboardLayoutClientProps = {
    children: React.ReactNode;
    groups: UserGroupsType;
};

export function DashboardLayoutClient({
    children,
    groups,
}: DashboardLayoutClientProps) {
    // usePathname generates a unique key for AnimatePresence so it can animate page changes.
    const pathname = usePathname();
    const router = useNexusRouter();
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(retrieveUserGroups(groups));
    }, [groups, dispatch]);
    // Derive current route segment (for example, "friends" from "/dashboard/friends")
    const currentRoute = pathname?.split('/')[2]?.toLowerCase() || 'friends';

    const dummyNavigation = {
        navigate: (routeName: string) => {
            router.push(`/dashboard/${routeName.toLowerCase()}`);
        },
        toggleDrawer: () => {},
        dispatch: () => {},
        reset: () => {},
        goBack: () => {},
        isFocused: () => true,
        addListener: () => () => {},
        removeListener: () => {},
    };

    console.log('remounting dashboard layout');

    return (
        <View style={styles.container}>
            {/* Sidebar area stays persistent */}
            <View style={styles.sidebar}>
                {/* Pass the current route and fetched groups to the SidebarScreen */}
                <SidebarScreen
                    navigation={dummyNavigation}
                    currentRoute={currentRoute}
                    groups={groups}
                />
            </View>

            {/* Main content area: dynamic routes animate on change */}
            <View style={styles.mainContent}>
                <AnimatePresence exitBeforeEnter>
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        style={{ width: '100%', height: '100%' }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        minHeight: '100vh', // Fills the viewport height
        flexDirection: 'row',
        backgroundColor: COLORS.AppBackground,
    },
    sidebar: {
        width: SIDEBAR_WIDTH,
        backgroundColor: COLORS.AppBackground,
        paddingTop: 20,
        paddingHorizontal: 10,
    },
    mainContent: {
        flex: 1,
        backgroundColor: COLORS.PrimaryBackground,
        minHeight: '100vh', // Fills the viewport height
    },
});
