import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';

function HomeScreen() {
    return null; // Replace with your component
}

function PeepsScreen() {
    return null; // Replace with your component
}

function GroupsScreen() {
    return null; // Replace with your component
}

function MessagesScreen() {
    return null; // Replace with your component
}

function AccountScreen() {
    return null; // Replace with your component
}

const Tab = createBottomTabNavigator();

function CustomTabBar({ state, descriptors, navigation }) {
    return (
        <LinearGradient colors={['#ff0084', '#33001b']} style={styles.tabBar}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label =
                    options.tabBarLabel !== undefined
                        ? options.tabBarLabel
                        : options.title !== undefined
                            ? options.title
                            : route.name;

                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({
                        type: 'tabLongPress',
                        target: route.key,
                    });
                };

                let iconName;
                switch (route.name) {
                    case 'Home':
                        iconName = isFocused ? 'home' : 'home-outline';
                        break;
                    case 'Peeps':
                        iconName = isFocused ? 'account-group' : 'account-group-outline';
                        break;
                    case 'Groups':
                        iconName = isFocused ? 'account-multiple' : 'account-multiple-outline';
                        break;
                    case 'Messages':
                        iconName = isFocused ? 'message' : 'message-outline';
                        break;
                    case 'Account':
                        iconName = isFocused ? 'account' : 'account-outline';
                        break;
                    default:
                        break;
                }

                return (
                    <View key={route.key} style={styles.tabItem}>
                        <Icon name={iconName} size={24} color={isFocused ? 'white' : 'gray'} onPress={onPress} onLongPress={onLongPress} />
                        <Text style={{ color: isFocused ? 'white' : 'gray' }}>{label}</Text>
                    </View>
                );
            })}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        flexDirection: 'row',
        height: 70,
        alignItems: 'center',
        justifyContent: 'space-around',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export function Navbar() {
    return (
        <NavigationContainer independent={true}>
            <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />}>
                <Tab.Screen name="Home" component={HomeScreen} />
                <Tab.Screen name="Peeps" component={PeepsScreen} />
                <Tab.Screen name="Groups" component={GroupsScreen} />
                <Tab.Screen name="Messages" component={MessagesScreen} />
                <Tab.Screen name="Account" component={AccountScreen} />
            </Tab.Navigator>
        </NavigationContainer>
    );
}
