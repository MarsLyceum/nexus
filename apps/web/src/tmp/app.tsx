'use client';

import React, { useEffect, useState, useContext } from 'react';
import {
    useWindowDimensions,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {
    useAppDispatch,
    loadUser,
    useAppSelector,
    RootState,
    UserGroupsType,
} from '@shared-ui/redux';
import { ActiveGroupContext } from '@shared-ui/providers';
import {
    FriendsScreen,
    DMListScreen,
    EventsScreen,
    SearchScreen,
    GroupScreen,
} from '@shared-ui/src/screens';
import { SidebarScreen } from '@shared-ui/src/screens/SidebarScreen';
import { COLORS, SIDEBAR_WIDTH } from '@shared-ui/constants';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';

export const AppPage: React.FC = () => {
    // Dispatch to load user info on mount.
    const dispatch = useAppDispatch();

    // Flag to determine if the component has mounted.
    const [mounted, setMounted] = useState(false);

    // State for interactive UI (client version)
    const [isDesktop, setIsDesktop] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeScreen, setActiveScreen] = useState('Friends');
    // Rename local state setter to avoid conflict with the context's setActiveGroup.
    const [activeGroup, setActiveGroupState] = useState<any>(null);

    // Destructure the context's setActiveGroup as contextSetActiveGroup.
    const { setActiveGroup: contextSetActiveGroup } =
        useContext(ActiveGroupContext);

    // Get window dimensions (client-only hook)
    const { width } = useWindowDimensions();

    // Get user groups from Redux.
    const userGroups: UserGroupsType = useAppSelector(
        (state: RootState) => state.userGroups.userGroups
    );

    // Fixed routes available in the client version.
    const routes = [
        { name: 'Friends', component: FriendsScreen },
        { name: 'Messages', component: DMListScreen },
        { name: 'Events', component: EventsScreen },
        { name: 'Search', component: SearchScreen },
    ];

    // Load user info on mount.
    useEffect(() => {
        dispatch(loadUser());
    }, [dispatch]);

    // Once mounted, update states based on window dimensions.
    useEffect(() => {
        setMounted(true);
        const desktop = width > 768;
        setIsDesktop(desktop);
        // For mobile, start with sidebar closed.
        setSidebarOpen(desktop ? true : false);
    }, [width]);

    // Navigation helpers.
    const handleNavigation = (screenName: string) => {
        setActiveScreen(screenName);
        if (!isDesktop) {
            setSidebarOpen(false);
        }
    };

    const handleGroupPress = (group: any) => {
        // Use the context setter and local state setter with distinct names.
        contextSetActiveGroup(group);
        setActiveGroupState(group);
        setActiveScreen(group.name);
        if (!isDesktop) {
            setSidebarOpen(false);
        }
    };

    // Determine which component to render.
    let ActiveComponent: React.ComponentType<any> | null = null;
    const fixedRoute = routes.find((route) => route.name === activeScreen);
    if (fixedRoute) {
        ActiveComponent = fixedRoute.component;
    } else if (activeGroup) {
        ActiveComponent = GroupScreen;
    }

    // Create a simulated navigation object that satisfies DrawerNavigationHelpers.
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
        dispatch: () => {},
        reset: () => {},
        goBack: () => {},
        isFocused: () => true,
        addListener: () => () => {},
        removeListener: () => {},
    };

    // Create dummy state to satisfy DrawerContentComponentProps.
    const simulatedState = {
        key: 'dummy',
        index: 0,
        routeNames: routes.map((route) => route.name),
        routes: routes.map((route) => ({ key: route.name, name: route.name })),
        type: 'drawer',
        stale: false,
    };

    // Create dummy descriptors for each route.
    const simulatedDescriptors = routes.reduce((acc, route) => {
        acc[route.name] = {
            options: {},
            navigation: simulatedNavigation,
            render: () => null,
        };
        return acc;
    }, {});

    // Construct the full props for SidebarScreen.
    const sidebarProps: DrawerContentComponentProps = {
        navigation: simulatedNavigation,
        state: simulatedState,
        descriptors: simulatedDescriptors,
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    // Base app layout: this is the unified UI (same as your BaseAppScreen)
    const renderBaseAppScreen = () => (
        <View style={styles.container}>
            {/* Sidebar area */}
            <View
                style={[
                    styles.sidebar,
                    !isDesktop && { display: sidebarOpen ? 'flex' : 'none' },
                ]}
            >
                <SidebarScreen {...sidebarProps} />
            </View>

            {/* Main content area */}
            <View style={styles.mainContent}>
                {/* Mobile header with hamburger button */}
                {!isDesktop && (
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={toggleSidebar}
                            style={styles.hamburger}
                        >
                            <FontAwesome name="bars" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                )}
                <View style={styles.screenContainer}>
                    {ActiveComponent ? (
                        <ActiveComponent />
                    ) : (
                        <Text style={{ color: COLORS.White }}>
                            No screen found
                        </Text>
                    )}
                </View>
            </View>
        </View>
    );

    // If not mounted, render the server version (defaults: desktop, sidebar open, FriendsScreen)
    if (!mounted) {
        return (
            <View style={styles.container}>
                <View style={styles.sidebar}>
                    <SidebarScreen {...sidebarProps} />
                </View>
                <View style={styles.mainContent}>
                    <FriendsScreen />
                </View>
            </View>
        );
    }

    // Once mounted, render the interactive version.
    return renderBaseAppScreen();
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        minHeight: '100vh', // Fills the viewport height on web
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
    },
    header: {
        height: 60,
        backgroundColor: COLORS.AppBackground,
        justifyContent: 'center',
        paddingHorizontal: 15,
    },
    hamburger: {
        width: 30,
        height: 30,
    },
    screenContainer: {
        flex: 1,
    },
});

export default AppPage;
