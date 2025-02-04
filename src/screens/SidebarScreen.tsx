import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Animated, StyleSheet, LayoutChangeEvent } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useApolloClient } from '@apollo/client';
import { createClient } from '@supabase/supabase-js';

import {
    retrieveUserGroups,
    useAppDispatch,
    useAppSelector,
    RootState,
    UserType,
    UserGroupsType,
} from '../redux';
import {
    ChatButton,
    GroupButton,
    EventsButton,
    CreateGroupButton,
} from '../buttons';
import { FETCH_USER_GROUPS_QUERY } from '../queries';
import { COLORS } from '../constants';
import { Group } from '../types';

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

// Initialize Supabase client
const supabaseUrl = 'https://zrgnvlobrohtrrqeajhy.supabase.co';
const supabaseAnonKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyZ252bG9icm9odHJycWVhamh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwODgzMjcsImV4cCI6MjA1MzY2NDMyN30.sfXfrw-_WGpxTl8C2TqLqG6Dgd6hUdN-wO3rwi9WMVc';
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

async function getSignedUrl(bucketName: string, filePath: string, expiry = 60) {
    const { data, error } = await supabaseClient.storage
        .from(bucketName)
        .createSignedUrl(filePath, expiry);

    if (error) {
        console.error('Error generating signed URL:', error.message);
        return '';
    }

    return data.signedUrl; // This URL can be used to access the image
}

export const SidebarScreen = ({ navigation }: DrawerContentComponentProps) => {
    // Default to "chat" as selected
    const [selectedButton, setSelectedButton] = useState<string>('chat');
    const user: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );
    const userGroups: UserGroupsType = useAppSelector(
        (state: RootState) => state.userGroups.userGroups
    );
    const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

    const dispatch = useAppDispatch();
    const apolloClient = useApolloClient();

    const setUserGroups = useCallback(
        (_userGroups: UserGroupsType) => {
            dispatch(retrieveUserGroups(_userGroups));
        },
        [dispatch]
    );

    useEffect(() => {
        // eslint-disable-next-line no-void
        void (async () => {
            const result = await apolloClient.query<{
                fetchUserGroups: [Group] | [];
            }>({
                query: FETCH_USER_GROUPS_QUERY,
                variables: {
                    userId: user?.id,
                },
            });

            setUserGroups(result.data.fetchUserGroups);
        })();
    }, [JSON.stringify(user)]);

    useEffect(() => {
        // eslint-disable-next-line no-void
        void (async () => {
            const newImageUrls: Record<string, string> = {};

            for (const group of userGroups) {
                // eslint-disable-next-line no-await-in-loop
                const groupAvatar = await getSignedUrl(
                    'group-avatars',
                    group.avatarFilePath ?? ''
                );
                newImageUrls[group.avatarFilePath ?? ''] = groupAvatar ?? '';
            }

            setImageUrls(newImageUrls);
        })();
    }, [userGroups]);

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

                {userGroups.map((group) => (
                    <View
                        onLayout={handleLayout(group.name)}
                        style={styles.buttonContainer}
                        key={group.id}
                    >
                        <GroupButton
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, global-require, unicorn/prefer-module
                            imageSource={{
                                uri: imageUrls[group.avatarFilePath ?? ''],
                            }}
                            onPress={() => {
                                setSelectedButton(group.name);
                                navigation.navigate(group.name);
                            }}
                        />
                    </View>
                ))}
            </View>
        </View>
    );
};
