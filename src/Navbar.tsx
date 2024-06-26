import React, { useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/core';

import { HomeIcon } from './icons/HomeIcon';
import { MatchingIcon } from './icons/MatchingIcon';
import { GroupsIcon } from './icons/GroupsIcon';
import { MessagesIcon } from './icons/MessagesIcon';
import { FriendsIcon } from './icons/FriendsIcon';

// TODO: animation like in 'peepsbutton'
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
    iconButton: {
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
        zIndex: 4,
    },
    messageCountText: {
        color: 'white',
        fontSize: 12,
    },
});

const AnimatedTabItem: React.FC<{
    IconComponent: React.ElementType; // Accept a component type
    label: string;
    isFocused: boolean;
    onPress: () => void;
    onLongPress: () => void;
    messageCount?: number;
}> = ({
    IconComponent,
    label,
    isFocused,
    onPress,
    onLongPress,
    messageCount,
}) => {
    const animationValue = React.useRef(new Animated.Value(0)).current;

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
            <Animated.View
                style={[styles.tabItem, { transform: [{ translateY }] }]}
            >
                {isFocused && (
                    <>
                        <View style={[styles.circle, styles.outerCircle]} />
                        <LinearGradient
                            colors={['#ff0084', '#33001b']}
                            style={[styles.circle, styles.innerCircle]}
                        />
                    </>
                )}
                <IconComponent
                    size={24}
                    color={isFocused ? 'white' : 'gray'}
                    onPress={onPress}
                    onLongPress={onLongPress}
                    style={styles.icon}
                />
                {label === 'Messages' && messageCount !== undefined && (
                    <View style={styles.messageCounter}>
                        <Text style={styles.messageCountText}>
                            {messageCount}
                        </Text>
                    </View>
                )}
            </Animated.View>
        </View>
    );
};

export function Navbar() {
    const [activeTab, setActiveTab] = useState('Home');
    const [messageCount, setMessageCount] = useState(5);
    const navigation = useNavigation();

    return (
        <LinearGradient colors={['#ff0084', '#33001b']} style={styles.tabBar}>
            <AnimatedTabItem
                IconComponent={getIconComponent('Home')}
                label={'Home'}
                isFocused={activeTab === 'Home'}
                onPress={() => {
                    setActiveTab('Home');
                    navigation.navigate('Home');
                }}
                onLongPress={() => {}}
            />
            <AnimatedTabItem
                IconComponent={getIconComponent('Matching')}
                label={'Matching'}
                isFocused={activeTab === 'Matching'}
                onPress={() => {
                    setActiveTab('Matching');
                    navigation.navigate('Matching');
                }}
                onLongPress={() => {}}
            />
            <AnimatedTabItem
                IconComponent={getIconComponent('Groups')}
                label={'Groups'}
                isFocused={activeTab === 'Groups'}
                onPress={() => {
                    setActiveTab('Groups');
                    navigation.navigate('Groups');
                }}
                onLongPress={() => {}}
            />
            <AnimatedTabItem
                IconComponent={getIconComponent('Messages')}
                label={'Messages'}
                isFocused={activeTab === 'Messages'}
                onPress={() => {
                    setActiveTab('Messages');
                    navigation.navigate('Messages');
                }}
                onLongPress={() => {}}
                messageCount={messageCount}
            />
            <AnimatedTabItem
                IconComponent={getIconComponent('Friends')}
                label={'Friends'}
                isFocused={activeTab === 'Friends'}
                onPress={() => {
                    setActiveTab('Friends');
                    navigation.navigate('Friends');
                }}
                onLongPress={() => {}}
            />
        </LinearGradient>
    );
}

function getIconComponent(routeName) {
    switch (routeName) {
        case 'Home': {
            return HomeIcon;
        }
        case 'Matching': {
            return MatchingIcon;
        }
        case 'Groups': {
            return GroupsIcon;
        }
        case 'Messages': {
            return MessagesIcon;
        }
        case 'Friends': {
            return FriendsIcon;
        }
        default: {
            return HomeIcon;
        } // default case to avoid errors
    }
}
