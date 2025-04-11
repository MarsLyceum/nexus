// AppDrawerScreen.tsx
import React, { useContext, useEffect } from 'react';
import {
    createDrawerNavigator,
    DrawerNavigationProp,
} from '@react-navigation/drawer';
import { TouchableOpacity, useWindowDimensions } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import { getItem } from 'shared-ui/utils';
import { COLORS, SIDEBAR_WIDTH, USER_KEY } from 'shared-ui/constants';
import { useAppSelector, RootState, UserGroupsType } from 'shared-ui/redux';
import { ActiveGroupContext } from 'shared-ui/providers';
import { Group } from 'shared-ui/types';
import {
    GroupScreen,
    SidebarScreen,
    DMListScreen,
    EventsScreen,
    SearchScreen,
    FriendsScreen,
    ThemeScreen,
} from 'shared-ui/screens';
import { useNexusRouter } from 'shared-ui/hooks';

// Define a DrawerParamList type so navigation is properly typed.
type DrawerParamList = {
    Messages: undefined;
    Events: undefined;
    Search: undefined;
    // Additional screens will use the group names as keys.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
};

const DrawerNavigator = createDrawerNavigator<DrawerParamList>();

export function AppDrawerScreen() {
    const router = useNexusRouter();

    const userGroups: UserGroupsType = useAppSelector(
        (state: RootState) => state.userGroups.userGroups
    );

    useEffect(() => {
        void (async () => {
            const userItem = await getItem(USER_KEY);
            if (!userItem) {
                router.push('login');
            }
        })();
    }, [router]);

    // Use window dimensions to determine if we're on "desktop" size
    const dimensions = useWindowDimensions();
    const isDesktop = dimensions.width > 768;

    // Get the setter for active group from context
    const { setActiveGroup } = useContext(ActiveGroupContext);

    return (
        <DrawerNavigator.Navigator
            screenOptions={({
                navigation,
            }: {
                navigation: DrawerNavigationProp<DrawerParamList>;
            }) => ({
                headerShown: !isDesktop,
                headerStyle: {
                    backgroundColor: COLORS.AppBackground,
                    elevation: 0, // Remove Android shadow
                    shadowOpacity: 0, // Remove iOS shadow
                    borderBottomWidth: 0, // Remove any bottom border if present
                },
                headerTitleStyle: {
                    fontFamily: 'Roboto_500Medium',
                },
                headerShadowVisible: false, // Disable the default header shadow
                headerTintColor: 'white',

                // On mobile, show a hamburger button; on desktop, use the search box in the header.
                headerLeft: () =>
                    !isDesktop && (
                        <TouchableOpacity
                            onPress={() => navigation.toggleDrawer()}
                            style={{ marginLeft: 15 }}
                        >
                            <FontAwesome name="bars" size={24} color="white" />
                        </TouchableOpacity>
                    ),

                headerTitle: () => undefined,

                // On desktop, the drawer is always open; on mobile, it slides in.
                drawerType: isDesktop ? 'permanent' : 'slide',
                drawerStyle: {
                    width: SIDEBAR_WIDTH,
                    borderRightWidth: 0,
                    borderRightColor: 'transparent',
                    backgroundColor: COLORS.AppBackground,
                },
                sceneContainerStyle: { flex: 1 },
            })}
            drawerContent={(props) => <SidebarScreen {...props} />}
        >
            <DrawerNavigator.Screen name="friends" component={FriendsScreen} />
            <DrawerNavigator.Screen name="messages" component={DMListScreen} />
            <DrawerNavigator.Screen name="events" component={EventsScreen} />
            <DrawerNavigator.Screen name="search" component={SearchScreen} />
            <DrawerNavigator.Screen name="theme" component={ThemeScreen} />

            {userGroups.map((group: Group) => (
                <DrawerNavigator.Screen
                    key={group.id}
                    name={group.name.toLowerCase()}
                    component={GroupScreen}
                    // When this screen is focused, set the active group in context.
                    listeners={{
                        focus: () => {
                            setActiveGroup(group);
                        },
                    }}
                />
            ))}

            {/*
        The Search screen is hidden from the drawer menu (height: 0)
        but accessible via the header right icon on mobile.
      */}
        </DrawerNavigator.Navigator>
    );
}
