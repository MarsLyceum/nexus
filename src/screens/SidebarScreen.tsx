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

const BUTTON_MARGIN_TOP = 32;

const styles = StyleSheet.create({
    sidebarButtonsContainer: {
        marginTop: BUTTON_MARGIN_TOP,
    },
    sidebarContainer: {
        width: 170,
        height: '100%',
        backgroundColor: COLORS.AppBackground,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start', // Changed from 'center' to 'flex-start'
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        overflow: 'hidden',
    },
    buttonContainer: {
        marginBottom: 16,
        width: '100%',
        alignItems: 'flex-start', // Changed from 'center' to 'flex-start'
        paddingLeft: 10, // Optional: adds some left padding for visual spacing
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
    console.log('loading image', new Date());
    const { data, error } = await supabaseClient.storage
        .from(bucketName)
        .createSignedUrl(filePath, expiry);
    console.log('done loading image', new Date());

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

    const setUserGroupsInStore = useCallback(
        (_userGroups: UserGroupsType) => {
            dispatch(retrieveUserGroups(_userGroups));
        },
        [dispatch]
    );

    // Fetch groups using Apollo
    useEffect(() => {
        // eslint-disable-next-line no-void
        void (async () => {
            console.log('starting to load groups');
            const result = await apolloClient.query<{
                fetchUserGroups: UserGroupsType;
            }>({
                query: FETCH_USER_GROUPS_QUERY,
                variables: {
                    userId: user?.id,
                },
            });

            console.log('groups loaded');
            setUserGroupsInStore(result.data.fetchUserGroups);
        })();
    }, [user?.id, apolloClient, setUserGroupsInStore]);

    // Fetch avatar URLs in parallel for groups that don't have a cached URL.
    useEffect(() => {
        if (userGroups.length === 0) return;
        // Only fetch URLs for groups whose avatar isn't already cached.
        const groupsMissingUrls = userGroups.filter(
            (group) => !imageUrls[group.avatarFilePath ?? '']
        );
        if (groupsMissingUrls.length === 0) return;

        // eslint-disable-next-line no-void
        void (async () => {
            const imageUrlPromises = groupsMissingUrls.map(async (group) => {
                const avatarPath = group.avatarFilePath ?? '';
                // Increase expiry to 3600 seconds (1 hour)
                const url = await getSignedUrl(
                    'group-avatars',
                    avatarPath,
                    3600
                );
                return { avatarPath, url: url ?? '' };
            });

            const results = await Promise.all(imageUrlPromises);
            setImageUrls((prev) => {
                const newImageUrls = { ...prev };
                results.forEach(({ avatarPath, url }) => {
                    newImageUrls[avatarPath] = url;
                });
                return newImageUrls;
            });
        })();
    }, [userGroups, imageUrls]);

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
                toValue: layout.y + BUTTON_MARGIN_TOP,
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
                {/* EVENTS Button */}
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
                {/* Render Group Buttons */}
                {userGroups.map((group) => (
                    <View
                        onLayout={handleLayout(group.name)}
                        style={styles.buttonContainer}
                        key={group.id}
                    >
                        <GroupButton
                            imageSource={{
                                uri: imageUrls[group.avatarFilePath ?? ''],
                            }}
                            onPress={() => {
                                setSelectedButton(group.name);
                                navigation.navigate(group.name);
                            }}
                            groupName={group.name}
                        />
                    </View>
                ))}
                {/* CREATE GROUP Button */}
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
            </View>
        </View>
    );
};
