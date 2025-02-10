// AppDrawerScreen.tsx
import React, { useContext } from 'react';
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
import { SearchContext } from '../providers';

const DrawerNavigator = createDrawerNavigator();

export function AppDrawerScreen() {
    const userGroups: UserGroupsType = useAppSelector(
        (state: RootState) => state.userGroups.userGroups
    );

    // Use window dimensions to determine if we're on "desktop" size
    const dimensions = useWindowDimensions();
    const isDesktop = dimensions.width > 768;

    // Use the shared search context instead of local state
    const { searchText, setSearchText } = useContext(SearchContext);

    return (
        <DrawerNavigator.Navigator
            screenOptions={({ navigation }) => ({
                headerShown: true,
                headerStyle: {
                    backgroundColor: COLORS.AppBackground,
                    fontFamily: 'Roboto_500Medium',
                    elevation: 0, // Remove Android shadow
                    shadowOpacity: 0, // Remove iOS shadow
                    borderBottomWidth: 0, // Remove any bottom border if present
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

                headerTitle: () =>
                    isDesktop ? (
                        <SearchBox
                            value={searchText}
                            onChangeText={setSearchText}
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
              The Search screen is hidden from the drawer menu (height: 0) 
              but accessible via the header right icon on mobile.
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
