import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { TouchableOpacity, useWindowDimensions } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import { COLORS } from '../constants';
import { useAppSelector, RootState, UserGroupsType } from '../redux';
import { ServerScreen, SidebarScreen, DMListScreen, EventsScreen } from '.';

const DrawerNavigator = createDrawerNavigator();

export function AppDrawerScreen() {
    const userGroups: UserGroupsType = useAppSelector(
        (state: RootState) => state.userGroups.userGroups
    );

    // Use window dimensions to determine if we're on desktop
    const dimensions = useWindowDimensions();
    const isDesktop = dimensions.width > 768;

    return (
        <DrawerNavigator.Navigator
            screenOptions={({ navigation }) => ({
                headerStyle: {
                    backgroundColor: COLORS.AppBackground,
                    fontFamily: 'Roboto_500Medium',
                },
                headerTintColor: 'white',
                // Hide the header entirely on desktop and thus remove the hamburger menu
                headerShown: !isDesktop,
                // Only show the hamburger menu on mobile/tablet
                headerLeft: () =>
                    !isDesktop && (
                        <TouchableOpacity
                            onPress={() => navigation.toggleDrawer()}
                            style={{ marginLeft: 15 }}
                        >
                            <FontAwesome name="bars" size={24} color="white" />
                        </TouchableOpacity>
                    ),
                // Permanently display the drawer on desktop
                drawerType: isDesktop ? 'permanent' : 'slide',
                drawerStyle: {
                    width: 170,
                    borderRightWidth: 0,
                    borderRightColor: 'transparent',
                    backgroundColor: COLORS.AppBackground,
                },
                sceneContainerStyle: { flex: 1 },
            })}
            drawerContent={(props) => <SidebarScreen {...props} />}
        >
            <DrawerNavigator.Screen name="Messages" component={DMListScreen} />
            <DrawerNavigator.Screen name="Events" component={EventsScreen} />
            {userGroups.map((group) => (
                <DrawerNavigator.Screen
                    name={group.name}
                    key={group.id}
                    component={ServerScreen}
                    initialParams={{ group }}
                />
            ))}
        </DrawerNavigator.Navigator>
    );
}
