// app/(dashboard)/DashboardLayoutClient.tsx

'use client';

import '../../../polyfills/expo-polyfills';
import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useNexusRouter } from 'shared-ui/hooks';
import { SidebarScreen } from 'shared-ui/screens';
import { SIDEBAR_WIDTH } from 'shared-ui/constants';
import { useTheme, Theme } from 'shared-ui/theme';
import {
    UserGroupsType,
    retrieveUserGroups,
    useAppDispatch,
} from 'shared-ui/redux';

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
    const { theme } = useTheme();

    const styles = useMemo(() => createDashboardStyles(theme), [theme]);

    useEffect(() => {
        dispatch(retrieveUserGroups(groups));
    }, [groups, dispatch]);
    // Derive current route segment (for example, "friends" from "/friends")
    const currentRoute = pathname?.split('/')[1]?.toLowerCase() || 'friends';

    const dummyNavigation = {
        navigate: (routeName: string) => {
            router.push(`/${routeName.toLowerCase()}`);
        },
        toggleDrawer: () => {},
        dispatch: () => {},
        reset: () => {},
        goBack: () => {},
        isFocused: () => true,
        // eslint-disable-next-line unicorn/consistent-function-scoping
        addListener: () => () => {},
        removeListener: () => {},
    };

    return (
        <View style={styles.container}>
            {/* Sidebar area stays persistent */}
            <View style={styles.sidebar}>
                {/* Pass the current route and fetched groups to the SidebarScreen */}
                <SidebarScreen
                    // @ts-expect-error navigation
                    navigation={dummyNavigation}
                    currentRoute={currentRoute}
                    groups={groups}
                />
            </View>

            {/* Main content area: dynamic routes animate on change */}
            <View style={styles.mainContent}>
                <AnimatePresence initial={false} mode="wait">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                        }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </View>
        </View>
    );
}

export function createDashboardStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flex: 1,
            height: '100vh',
            minHeight: '100vh', // Fills the viewport height
            flexDirection: 'row',
            backgroundColor: theme.colors.AppBackground,
            overflow: 'hidden',
        },
        sidebar: {
            width: SIDEBAR_WIDTH,
            backgroundColor: theme.colors.AppBackground,
            paddingTop: 20,
            paddingHorizontal: 10,
            height: '100%',
            overflowY: 'auto',
        },
        mainContent: {
            flex: 1,
            backgroundColor: theme.colors.PrimaryBackground,
            position: 'relative',
            height: '100%',
            overflowY: 'auto',
        },
    });
}
