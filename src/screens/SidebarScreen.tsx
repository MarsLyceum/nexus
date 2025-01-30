import React, { useRef, useState, useEffect } from 'react';
import { View, Animated } from 'react-native';
import { NavigationProp } from '@react-navigation/core';

import { ChatButton, GroupButton, EventsButton } from '../buttons';

export const SidebarScreen = ({
    navigation,
}: Readonly<{
    navigation: NavigationProp<Record<string, unknown>>;
}>) => {
    // Default to "chat" as selected
    const [selectedButton, setSelectedButton] = useState<string>('chat');

    // Store each button's layout as { y, height }
    const [buttonLayouts, setButtonLayouts] = useState<{
        [key: string]: { y: number; height: number };
    }>({});

    // Animated values for highlight top + height
    const highlightTop = useRef(new Animated.Value(0)).current;
    const highlightHeight = useRef(new Animated.Value(40)).current; // fallback default

    // -- This is our 16px spacing between buttons:
    const SPACING = 16;

    // Capture each button's y & height
    const handleLayout = (name: string) => (event: any) => {
        const { y, height } = event.nativeEvent.layout;
        console.log(
            `handleLayout -> Button "${name}" measured at y=${y}, height=${height}`
        );
        setButtonLayouts((prev) => ({
            ...prev,
            [name]: { y, height },
        }));
    };

    // Animate highlight to match the selected button’s layout
    useEffect(() => {
        const layout = buttonLayouts[selectedButton];
        console.log(
            `useEffect -> selectedButton="${selectedButton}", layout=`,
            layout
        );

        if (layout) {
            console.log(
                `Animating highlight: top from current to ${layout.y}, height to ${layout.height}`
            );
            Animated.spring(highlightTop, {
                toValue: layout.y,
                useNativeDriver: false,
            }).start();

            Animated.spring(highlightHeight, {
                toValue: layout.height,
                useNativeDriver: false,
            }).start();
        }
    }, [selectedButton, buttonLayouts, highlightTop, highlightHeight]);

    return (
        // "box-none" so the container itself won't intercept touches
        <View pointerEvents="box-none" style={styles.sidebarContainer}>
            {/* Left-Side Rectangle Highlight: pointerEvents="none" means it never grabs touches. */}
            <Animated.View
                pointerEvents="none"
                style={[
                    styles.highlight,
                    {
                        top: highlightTop,
                        height: highlightHeight,
                    },
                ]}
            />

            {/* CHAT Button Container */}
            <View
                onLayout={handleLayout('chat')}
                style={styles.buttonContainer}
            >
                <ChatButton
                    onPress={() => {
                        setSelectedButton('chat');
                        navigation.navigate('DMs');
                    }}
                />
            </View>

            <View
                onLayout={handleLayout('events')}
                style={styles.buttonContainer}
            >
                <EventsButton
                    onPress={() => {
                        setSelectedButton('events');
                        navigation.navigate('Events');
                    }}
                />
            </View>

            {/* SERVER1 Button Container */}
            <View
                onLayout={handleLayout('server1')}
                style={styles.buttonContainer}
            >
                <GroupButton
                    imageSource={require('../images/playstation_controller.jpg')}
                    onPress={() => {
                        setSelectedButton('server1');
                        navigation.navigate('Server1');
                    }}
                />
            </View>

            {/* SERVER2 Button Container */}
            <View
                onLayout={handleLayout('server2')}
                style={styles.buttonContainer}
            >
                <GroupButton
                    imageSource={require('../images/mario.jpg')}
                    onPress={() => {
                        setSelectedButton('server2');
                        navigation.navigate('Server2');
                    }}
                />
            </View>
        </View>
    );
};

const styles = {
    sidebarContainer: {
        width: 80,
        backgroundColor: '#1F1524',
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        position: 'relative',
    },
    buttonContainer: {
        // This container is measured by 'handleLayout'
        // Each one wraps exactly one "Button" so we know that button's y, height
        marginBottom: 16, // add 16px spacing below each
        width: '100%',
        alignItems: 'center',
    },
    highlight: {
        position: 'absolute',
        left: 0,
        width: 4,
        backgroundColor: '#F2F3F5',
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        zIndex: 999,
    },
};
