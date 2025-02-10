// AppDrawerScreen.tsx

import React, { useState } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import {
    TouchableOpacity,
    useWindowDimensions,
    View,
    StyleSheet,
    TextInput,
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

const DrawerNavigator = createDrawerNavigator();

export function AppDrawerScreen() {
    const userGroups: UserGroupsType = useAppSelector(
        (state: RootState) => state.userGroups.userGroups
    );

    // Use window dimensions to determine if we're on "desktop" size
    const dimensions = useWindowDimensions();
    const isDesktop = dimensions.width > 768;

    // We'll store the user's search text here if you want the desktop
    // header search box to do something. For demonstration, it's just local.
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

                // On desktop, show a large text input with a search icon.
                // On mobile, show a simple search icon that navigates to 'Search' screen.
                headerTitle: () =>
                    isDesktop ? (
                        <View
                            style={[
                                styles.desktopSearchContainer,
                                { width: dimensions.width * 0.45 },
                            ]}
                        >
                            <FontAwesome name="search" size={16} color="#999" />
                            <TextInput
                                style={styles.desktopSearchInput}
                                placeholder="Search"
                                placeholderTextColor="#999"
                                value={desktopSearchText}
                                onChangeText={setDesktopSearchText}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
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

                // On desktop, the drawer is always open and doesn't need a toggle
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
        // Basic styling for the search box
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.TextInput,
        borderRadius: 6,
        paddingHorizontal: 10,
        height: 36,
        // If you want it centered horizontally, you can add marginLeft: 'auto', marginRight: 'auto',
    },
    desktopSearchInput: {
        flex: 1,
        marginLeft: 6,
        padding: 0,
        color: COLORS.White,
        fontSize: 15,
        fontFamily: 'Roboto_400Regular',
    },
});
