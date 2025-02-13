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
    sidebarContainer: {
        width: 170,
        height: '100%',
        backgroundColor: COLORS.AppBackground,
        paddingTop: BUTTON_MARGIN_TOP,
        paddingLeft: 10, // All items align with this left padding
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        overflow: 'hidden',
    },
    sidebarButtonsContainer: {
        // Container for all sidebar items
    },
    buttonContainer: {
        marginBottom: 16,
    },
    highlight: {
        position: 'absolute',
        left: 0,
        width: 4,
        backgroundColor: COLORS.OffWhite,
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        zIndex: 999,
    },
    // Skeleton styles for group button placeholder
    skeletonButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    skeletonAvatar: {
        width: 32,
        height: 32,
        borderRadius: 20,
        backgroundColor: COLORS.InactiveText,
        marginRight: 10,
    },
    skeletonText: {
        width: 100,
        height: 15,
        borderRadius: 4,
        backgroundColor: COLORS.InactiveText,
    },
});

//
// Initialize Supabase client
//
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
    return data.signedUrl;
}

// Skeleton component for the group button placeholder
const SkeletonGroupButton = () => (
    <View style={styles.skeletonButton}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonText} />
    </View>
);

export const SidebarScreen = ({ navigation }: DrawerContentComponentProps) => {
    // State for the currently selected button (used for highlighting)
    const [selectedButton, setSelectedButton] = useState<string>('chat');
    const user: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );
    const userGroups: UserGroupsType = useAppSelector(
        (state: RootState) => state.userGroups.userGroups
    );
    const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
    const [loadingGroups, setLoadingGroups] = useState<boolean>(true);

    const dispatch = useAppDispatch();
    const apolloClient = useApolloClient();

    const setUserGroupsInStore = useCallback(
        (groups: UserGroupsType) => {
            dispatch(retrieveUserGroups(groups));
        },
        [dispatch]
    );

    // Fetch groups from Apollo
    useEffect(() => {
        void (async () => {
            const result = await apolloClient.query<{
                fetchUserGroups: UserGroupsType;
            }>({
                query: FETCH_USER_GROUPS_QUERY,
                variables: { userId: user?.id },
            });
            setUserGroupsInStore(result.data.fetchUserGroups);
            setLoadingGroups(false);
        })();
    }, [user?.id, apolloClient, setUserGroupsInStore]);

    // Fetch missing avatar URLs
    useEffect(() => {
        if (userGroups.length === 0) return;
        const groupsMissingUrls = userGroups.filter(
            (group) => !imageUrls[group.avatarFilePath ?? '']
        );
        if (groupsMissingUrls.length === 0) return;
        void (async () => {
            const imageUrlPromises = groupsMissingUrls.map(async (group) => {
                const avatarPath = group.avatarFilePath ?? '';
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

    // --- Measure Button Layouts for Active Indicator ---
    const [buttonLayouts, setButtonLayouts] = useState<{
        [key: string]: { y: number; height: number };
    }>({});
    const handleLayout = (name: string) => (event: LayoutChangeEvent) => {
        const { y, height } = event.nativeEvent.layout;
        setButtonLayouts((prev) => ({
            ...prev,
            [name]: { y, height },
        }));
    };

    // --- Ref for Container (for active indicator measurements) ---
    const sidebarButtonsContainerRef = useRef<View>(null);
    // Ref for CreateGroup button container
    const createGroupRef = useRef<View>(null);

    // --- Animated Values for Active Indicator ---
    const highlightTop = useRef(new Animated.Value(BUTTON_MARGIN_TOP)).current;
    const highlightHeight = useRef(new Animated.Value(40)).current;

    // Update active indicator when selectedButton or its layout changes
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
    }, [selectedButton, buttonLayouts]);

    // Re-measure the CreateGroup button whenever it's selected
    useEffect(() => {
        if (
            selectedButton === 'createGroup' &&
            createGroupRef.current &&
            sidebarButtonsContainerRef.current
        ) {
            createGroupRef.current.measureLayout(
                sidebarButtonsContainerRef.current,
                (x, y, width, height) => {
                    setButtonLayouts((prev) => ({
                        ...prev,
                        createGroup: { y, height },
                    }));
                },
                (error) => console.error('Error measuring CreateGroup', error)
            );
        }
    }, [selectedButton]);

    return (
        <View style={styles.sidebarContainer}>
            {/* Active Button Highlight */}
            <Animated.View
                pointerEvents="none"
                style={[
                    styles.highlight,
                    { top: highlightTop, height: highlightHeight },
                ]}
            />
            <View
                style={styles.sidebarButtonsContainer}
                ref={sidebarButtonsContainerRef}
            >
                {/* CHAT Button */}
                <View
                    onLayout={handleLayout('chat')}
                    style={styles.buttonContainer}
                >
                    <ChatButton
                        onPress={() => {
                            setSelectedButton('chat');
                            navigation.navigate('Messages');
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
                {/* Groups List */}
                {loadingGroups
                    ? [0, 1, 2].map((placeholder) => (
                          <View
                              style={styles.buttonContainer}
                              key={`skeleton-${placeholder}`}
                          >
                              <SkeletonGroupButton />
                          </View>
                      ))
                    : userGroups.map((group) => (
                          <View
                              onLayout={handleLayout(group.name)}
                              style={styles.buttonContainer}
                              key={group.id}
                          >
                              <GroupButton
                                  imageSource={{
                                      uri: imageUrls[
                                          group.avatarFilePath ?? ''
                                      ],
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
                    ref={createGroupRef}
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
