import React, { useRef, useState, useEffect } from 'react';
import { View, Animated, StyleSheet, LayoutChangeEvent } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';

import { ChatButton, GroupButton, EventsButton } from '../buttons';
import { COLORS } from '../constants';

const BUTTON_MARGIN_TOP = 32;

const styles = StyleSheet.create({
    sidebarButtonsContainer: {
        marginTop: BUTTON_MARGIN_TOP,
    },
    sidebarContainer: {
        width: 80,
        height: '100%',
        backgroundColor: COLORS.AppBackground,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        overflow: 'hidden',
    },
    buttonContainer: {
        marginBottom: 16,
        width: '100%',
        alignItems: 'center',
    },
    highlight: {
        position: 'absolute',
        left: 0,
        width: 4,
        backgroundColor: COLORS.OffWhite,
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        zIndex: 999,
        right: 'auto',
    },
});

export const SidebarScreen = ({ navigation }: DrawerContentComponentProps) => {
    // Default to "chat" as selected
    const [selectedButton, setSelectedButton] = useState<string>('chat');

    // Store each button's layout as { y, height }
    const [buttonLayouts, setButtonLayouts] = useState<{
        [key: string]: { y: number; height: number };
    }>({});

    // Animated values for highlight top + height
    const highlightTop = useRef(new Animated.Value(BUTTON_MARGIN_TOP)).current;
    const highlightHeight = useRef(new Animated.Value(40)).current; // Default height

    // Capture each button's y & height
    const handleLayout = (name: string) => (event: LayoutChangeEvent) => {
        const { y, height } = event.nativeEvent.layout;
        setButtonLayouts((prev) => ({
            ...prev,
            [name]: { y, height },
        }));
    };

    // Animate highlight to match the selected button’s layout
    useEffect(() => {
        const layout = buttonLayouts[selectedButton];
        if (layout) {
            Animated.spring(highlightTop, {
                toValue: layout.y + BUTTON_MARGIN_TOP, // Use the variable instead of hardcoded value
                useNativeDriver: false,
            }).start();

            Animated.spring(highlightHeight, {
                toValue: layout.height,
                useNativeDriver: false,
            }).start();
        }
    }, [selectedButton, buttonLayouts, highlightTop, highlightHeight]);

    return (
        <View style={styles.sidebarContainer}>
            {/* Left-Side Rectangle Highlight */}
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
            <View style={styles.sidebarButtonsContainer}>
                {/* CHAT Button */}
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

                {/* SERVER1 Button */}
                <View
                    onLayout={handleLayout('server1')}
                    style={styles.buttonContainer}
                >
                    <GroupButton
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, global-require, unicorn/prefer-module
                        imageSource={require('../images/playstation_controller.jpg')}
                        onPress={() => {
                            setSelectedButton('server1');
                            navigation.navigate('Server1');
                        }}
                    />
                </View>

                {/* SERVER2 Button */}
                <View
                    onLayout={handleLayout('server2')}
                    style={styles.buttonContainer}
                >
                    <GroupButton
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, global-require, unicorn/prefer-module
                        imageSource={require('../images/mario.jpg')}
                        onPress={() => {
                            setSelectedButton('server2');
                            navigation.navigate('Server2');
                        }}
                    />
                </View>
            </View>
        </View>
    );
};
