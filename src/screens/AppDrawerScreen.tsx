// AppDrawerScreen.tsx
import React, { useState } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import {
    TouchableOpacity,
    useWindowDimensions,
    View,
    StyleSheet,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import { COLORS } from '../constants';
import { useAppSelector, RootState, UserGroupsType } from '../redux';
import {
    ServerScreen,
    SidebarScreen,
    DMListScreen,
    EventsScreen,
    SearchScreen,
} from '.';
import { SearchBox } from '../sections';

const DrawerNavigator = createDrawerNavigator();

export function AppDrawerScreen() {
    const userGroups: UserGroupsType = useAppSelector(
        (state: RootState) => state.userGroups.userGroups
    );

    // Use window dimensions to determine if we're on "desktop" size
    const dimensions = useWindowDimensions();
    const isDesktop = dimensions.width > 768;

    // Store the desktop search text locally
    const [desktopSearchText, setDesktopSearchText] = useState('');

    return (
        <DrawerNavigator.Navigator
            screenOptions={({ navigation }) => ({
                /**
                 * Always show a header so that on desktop we can
                 * display the search bar in the header.
                 */
                headerShown: true,
                headerStyle: {
                    backgroundColor: COLORS.AppBackground,
                    fontFamily: 'Roboto_500Medium',
                },
                headerTintColor: 'white',

                // On desktop, no hamburger menu; on mobile, show the hamburger left button
                headerLeft: () =>
                    !isDesktop && (
                        <TouchableOpacity
                            onPress={() => navigation.toggleDrawer()}
                            style={{ marginLeft: 15 }}
                        >
                            <FontAwesome name="bars" size={24} color="white" />
                        </TouchableOpacity>
                    ),

                // On desktop, display the shared SearchBox in the header.
                // On mobile, the header remains empty and the search icon is shown on the right.
                headerTitle: () =>
                    isDesktop ? (
                        <SearchBox
                            value={desktopSearchText}
                            onChangeText={setDesktopSearchText}
                            desktop
                        />
                    ) : null,

                headerRight: () =>
                    !isDesktop && (
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Search')}
                            style={{ marginRight: 15 }}
                        >
                            <FontAwesome
                                name="search"
                                size={24}
                                color="white"
                            />
                        </TouchableOpacity>
                    ),

                // On desktop, the drawer is always open; on mobile, it slides in.
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
            {/*
        Add a new Search screen.
        The option drawerItemStyle with height: 0 hides the item in the drawer menu.
        We also show the header on this screen (even on desktop).
      */}
            <DrawerNavigator.Screen
                name="Search"
                component={SearchScreen}
                options={{
                    drawerItemStyle: { height: 0 },
                }}
            />
        </DrawerNavigator.Navigator>
    );
}

const styles = StyleSheet.create({
    desktopSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.TextInput,
        borderRadius: 6,
        paddingHorizontal: 10,
        height: 36,
    },
});
