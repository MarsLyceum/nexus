import React, { useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/core';

// Import custom SVG icons
import HomeIcon from './icons/HomeIcon';
import MatchingIcon from './icons/MatchingIcon';
import GroupsIcon from './icons/GroupsIcon';
import MessagesIcon from './icons/MessagesIcon';
import FriendsIcon from './icons/FriendsIcon';

type IconName = 'HomeIcon' | 'MatchingIcon' | 'GroupsIcon' | 'MessagesIcon' | 'FriendsIcon';

const getIconComponent = (iconName: IconName) => {
    switch (iconName) {
        case 'HomeIcon': { return <HomeIcon width={24} height={24} />; }
        case 'MatchingIcon': { return <MatchingIcon width={24} height={24} />; }
        case 'GroupsIcon': { return <GroupsIcon width={24} height={24} />; }
        case 'MessagesIcon': { return <MessagesIcon width={24} height={24} />; }
        case 'FriendsIcon': { return <FriendsIcon width={24} height={24} />; }
        default: { return null; }
    }
};

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
    iconButton: {
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3,
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
    iconName: string;
    label: string;
    isFocused: boolean;
    onPress: () => void;
    onLongPress: () => void;
    messageCount?: number;
}> = ({ iconName, label, isFocused, onPress, onLongPress, messageCount }) => {
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
                <TouchableOpacity onPress={onPress} onLongPress={onLongPress} style={styles.iconButton}>
                    {getIconComponent(iconName)}
                </TouchableOpacity>
                {label === 'Messages' && messageCount !== undefined && (
                    <View style={styles.messageCounter}>
                        <Text style={styles.messageCountText}>{messageCount}</Text>
                    </View>
                )}
            </Animated.View>
        </View>
    );
};

export function Navbar() {
    const [activeTab, setActiveTab] = useState('Matching');
    const [messageCount] = useState(5);
    const navigation = useNavigation();

    return (
        <LinearGradient colors={['#ff0084', '#33001b']} style={styles.tabBar}>
            {['Home', 'Matching', 'Groups', 'Messages', 'Friends'].map((label) => (
                <AnimatedTabItem
                    key={label}
                    iconName={`${label}Icon` as IconName}
                    label={label}
                    isFocused={activeTab === label}
                    onPress={() => {
                        setActiveTab(label);
                        navigation.navigate(label);
                    }}
                    onLongPress={() => {}}
                    messageCount={label === 'Messages' ? messageCount : undefined}
                />
            ))}
        </LinearGradient>
    );
}

