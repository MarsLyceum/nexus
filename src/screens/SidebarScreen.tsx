import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Animated, StyleSheet, LayoutChangeEvent } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useApolloClient } from '@apollo/client';

import {
    retrieveUserGroups,
    useAppDispatch,
    useAppSelector,
    UserGroupsType,
    RootState,
} from '../redux';
import {
    ChatButton,
    GroupButton,
    EventsButton,
    CreateGroupButton,
} from '../buttons';
import { FETCH_USER_GROUPS_QUERY } from '../queries';
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
    const user = useAppSelector((state: RootState) => state.user.user);

    const dispatch = useAppDispatch();
    const apolloClient = useApolloClient();

    const setUserGroups = useCallback(
        (userGroups: UserGroupsType) => {
            dispatch(retrieveUserGroups(userGroups));
        },
        [dispatch]
    );

    useEffect(() => {
        // eslint-disable-next-line no-void
        void (async () => {
            const result = await apolloClient.query({
                query: FETCH_USER_GROUPS_QUERY,
                variables: {
                    email: user?.email,
                },
            });

            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
            setUserGroups(result.data.fetchUserGroups);
        })();
    }, [JSON.stringify(user)]);

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

                <View
                    onLayout={handleLayout('createGroup')}
                    style={styles.buttonContainer}
                >
                    <CreateGroupButton
                        onPress={() => {
                            setSelectedButton('createGroup');
                            navigation.navigate('CreateGroup');
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
