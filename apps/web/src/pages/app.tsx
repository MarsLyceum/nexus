'use client';

import React, { useContext, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    StyleSheet,
    ScrollView,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import { COLORS, SIDEBAR_WIDTH } from '@shared-ui/constants';
import { useAppSelector, RootState, UserGroupsType } from '@shared-ui/redux';
import { ActiveGroupContext } from '@shared-ui/providers';

import {
    FriendsScreen,
    DMListScreen,
    EventsScreen,
    SearchScreen,
    GroupScreen,
} from '@shared-ui/src/screens';
// Import your SidebarScreen that includes the animated highlight and group buttons.
import { SidebarScreen } from '@shared-ui/src/screens/SidebarScreen';

interface AppDrawerScreenProps {}

export default function AppDrawerScreen(): JSX.Element {
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
    // Get the setter for active group from context.
    const { setActiveGroup } = useContext(ActiveGroupContext);

    // Define fixed routes and their corresponding components.
    const routes = [
        { name: 'Friends', component: FriendsScreen },
        { name: 'Messages', component: DMListScreen },
        { name: 'Events', component: EventsScreen },
        { name: 'Search', component: SearchScreen },
    ];

    // Simulate navigation for fixed routes.
    const handleNavigation = (screenName: string) => {
        setActiveScreen(screenName);
        if (!isDesktop) {
            setSidebarOpen(false);
        }
    };

    // Simulate group screen navigation.
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

    // Create a simulated navigation object for the SidebarScreen.
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

    return (
        <View style={styles.container}>
            {/* Sidebar area using the SidebarScreen component. */}
            <View
                style={[
                    styles.sidebar,
                    !isDesktop && { display: sidebarOpen ? 'flex' : 'none' },
                ]}
            >
                <SidebarScreen navigation={simulatedNavigation} />
            </View>

            {/* Main Content Area */}
            <View style={styles.mainContent}>
                {/* Mobile header with hamburger button */}
                {!isDesktop && (
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => setSidebarOpen(!sidebarOpen)}
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
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        minHeight: '100vh', // Ensure the container fills the viewport height on web
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
