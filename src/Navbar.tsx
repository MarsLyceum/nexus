import React, { useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HomeScreen } from './HomeScreen';
import { MatchingScreen } from './MatchingScreen';
import { GroupsScreen } from './GroupsScreen';
import { MessagesScreen } from './MessagesScreen';
import { FriendsScreen } from './FriendsScreen';

const Tab = createBottomTabNavigator();

export function Navbar() {
    const [activeTab, setActiveTab] = useState('Home');
    const [messageCount, setMessageCount] = useState(5); // Example message count

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#ff0084', '#33001b']} style={styles.gradient}>
                <Tab.Navigator
                    screenOptions={({ route }) => ({
                        tabBarButton: (props) => (
                            <TouchableOpacity
                                key={route.name}
                                style={styles.tabButton}
                                onPress={() => {
                                    setActiveTab(route.name);
                                    props.onPress();
                                }}
                                onLongPress={props.onLongPress}
                            >
                                <Icon
                                    name={getIconName(route.name)}
                                    size={24}
                                    color={activeTab === route.name ? 'white' : 'gray'}
                                />
                                {route.name === 'Messages' && (
                                    <View style={styles.messageCounter}>
                                        <Text style={styles.messageCountText}>{messageCount}</Text>
                                    </View>
                                )}
                                <Text style={{ color: activeTab === route.name ? 'white' : 'gray' }}>
                                    {route.name}
                                </Text>
                            </TouchableOpacity>
                        ),
                    })}
                    tabBarOptions={{
                        showLabel: false,
                        style: styles.tabBar,
                    }}
                >
                    <Tab.Screen name="Home" component={HomeScreen} />
                    <Tab.Screen name="Matching" component={MatchingScreen} />
                    <Tab.Screen name="Groups" component={GroupsScreen} />
                    <Tab.Screen name="Messages" component={MessagesScreen} />
                    <Tab.Screen name="Friends" component={FriendsScreen} />
                </Tab.Navigator>
            </LinearGradient>
        </View>
    );
}

function getIconName(routeName: string) {
    switch (routeName) {
        case 'Home':
            return 'home';
        case 'Matching':
            return 'account-heart';
        case 'Groups':
            return 'account-multiple';
        case 'Messages':
            return 'message';
        case 'Friends':
            return 'account-group';
        default:
            return 'circle';
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    tabBar: {
        height: 70,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: 'transparent', // Ensure gradient shows through
    },
    tabButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    messageCounter: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: 'red',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageCountText: {
        color: 'white',
        fontSize: 12,
    },
});