import React from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
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

                return (
                    <AnimatedTabItem
                        key={route.key}
                        iconName={getIconName(route.name, isFocused)}
                        label={label}
                        isFocused={isFocused}
                        onPress={onPress}
                        onLongPress={onLongPress}
                    />
                );
            })}
        </LinearGradient>
    );
}

function AnimatedTabItem({ iconName, label, isFocused, onPress, onLongPress }) {
    const animationValue = new Animated.Value(0);

    React.useEffect(() => {
        Animated.timing(animationValue, {
            toValue: isFocused ? 1 : 0,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
        }).start();
    }, [isFocused]);

    const translateY = animationValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -30],
    });

    return (
        <View style={styles.tabItemContainer}>
            <Animated.View style={[styles.tabItem, { transform: [{ translateY }] }]}>
                {isFocused && (
                    <>
                        <View style={[styles.circle, styles.outerCircle]} />
                        <LinearGradient
                            colors={['#ff0084', '#33001b']}
                            style={[styles.circle, styles.innerCircle]}
                        />
                    </>
                )}
                <Icon name={iconName} size={24} color={isFocused ? 'white' : 'gray'} onPress={onPress} onLongPress={onLongPress} style={styles.icon} />
            </Animated.View>
        </View>
    );
}

function getIconName(routeName, isFocused) {
    switch (routeName) {
        case 'Home':
            return 'home';
        case 'Peeps':
            return 'account-group';
        case 'Groups':
            return 'account-multiple';
        case 'Messages':
            return 'message';
        case 'Account':
            return 'account';
        default:
            return '';
    }
}

const styles = StyleSheet.create({
    tabBar: {
        flexDirection: 'row',
        height: 70,
        alignItems: 'center',
        justifyContent: 'space-around',
        borderTopLeftRadius: 100,
        borderTopRightRadius: 100,
        borderBottomLeftRadius: 100,
        borderBottomRightRadius: 100,
    },
    tabItemContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    circle: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
    },
    outerCircle: {
        backgroundColor: 'white',
        width: 64,
        height: 64,
        borderRadius: 32,
        zIndex: 1,
    },
    innerCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        zIndex: 2,
    },
    icon: {
        zIndex: 3,
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
