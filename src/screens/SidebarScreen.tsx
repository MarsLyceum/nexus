import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    View,
    Animated,
    StyleSheet,
    LayoutChangeEvent,
    ScrollView,
} from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useApolloClient } from '@apollo/client';

import {
    retrieveUserGroups,
    useAppDispatch,
    useAppSelector,
    RootState,
    UserType,
    UserGroupsType,
} from '../redux';
import { GroupButton, SidebarButton } from '../buttons';
import { Friends, Chat, Events, Search, Add } from '../icons';
import { FETCH_USER_GROUPS_QUERY } from '../queries';
import { COLORS } from '../constants';

const BUTTON_MARGIN_TOP = 32;
const CONTENT_PADDING_LEFT = 10;

const styles = StyleSheet.create({
    // Outer container for the scroll view.
    sidebarContainer: {
        width: 170,
        height: '100%',
        backgroundColor: COLORS.AppBackground,
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        overflow: 'hidden',
    },
    // This container holds the buttons.
    sidebarButtonsContainer: {
        // No extra horizontal padding here – we add it via contentContainerStyle.
        // Relative positioning needed for the highlight.
        position: 'relative',
    },
    buttonContainer: {
        marginBottom: 16,
    },
    highlight: {
        position: 'absolute',
        // Set left to negative of the content padding so that the highlight is flush with the left edge.
        left: -CONTENT_PADDING_LEFT,
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
        width: 45,
        height: 45,
        borderRadius: 20,
        backgroundColor: COLORS.InactiveText,
        marginRight: 10,
    },
    skeletonText: {
        width: 100,
        height: 16,
        borderRadius: 4,
        backgroundColor: COLORS.InactiveText,
    },
});

// Skeleton component for the group button placeholder
const SkeletonGroupButton = () => (
    <View style={styles.skeletonButton}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonText} />
    </View>
);

export const SidebarScreen = ({ navigation }: DrawerContentComponentProps) => {
    const [selectedButton, setSelectedButton] = useState<string>('friends');
    const user: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );
    const userGroups: UserGroupsType = useAppSelector(
        (state: RootState) => state.userGroups.userGroups
    );
    const [loadingGroups, setLoadingGroups] = useState<boolean>(true);

    const dispatch = useAppDispatch();
    const apolloClient = useApolloClient();

    const setUserGroupsInStore = useCallback(
        (groups: UserGroupsType) => {
            dispatch(retrieveUserGroups(groups));
        },
        [dispatch]
    );

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

    const [buttonLayouts, setButtonLayouts] = useState<{
        [key: string]: { y: number; height: number };
    }>({});

    const handleLayout = (name: string) => (event: LayoutChangeEvent) => {
        const { y, height } = event.nativeEvent.layout;
        setButtonLayouts((prev) => ({ ...prev, [name]: { y, height } }));
    };

    const sidebarButtonsContainerRef = useRef<View>(null);
    const createGroupRef = useRef<View>(null);

    const highlightTop = useRef(new Animated.Value(0)).current;
    const highlightHeight = useRef(new Animated.Value(40)).current;

    // Animate the highlight based on the selected button's layout.
    useEffect(() => {
        const layout = buttonLayouts[selectedButton];
        if (layout) {
            Animated.spring(highlightTop, {
                toValue: layout.y,
                useNativeDriver: false,
            }).start();
            Animated.spring(highlightHeight, {
                toValue: layout.height,
                useNativeDriver: false,
            }).start();
        }
    }, [selectedButton, buttonLayouts]);

    // Update layout for createGroup if needed.
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
                }
            );
        }
    }, [selectedButton]);

    return (
        <ScrollView
            style={styles.sidebarContainer}
            // Apply padding via contentContainerStyle so the items get the proper padding.
            contentContainerStyle={{
                paddingTop: BUTTON_MARGIN_TOP,
                paddingLeft: CONTENT_PADDING_LEFT,
            }}
        >
            {/* Move highlight inside the buttons container so coordinates match */}
            <View
                style={styles.sidebarButtonsContainer}
                ref={sidebarButtonsContainerRef}
            >
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.highlight,
                        { top: highlightTop, height: highlightHeight },
                    ]}
                />
                <View
                    onLayout={handleLayout('friends')}
                    style={styles.buttonContainer}
                >
                    <SidebarButton
                        onPress={() => {
                            setSelectedButton('friends');
                            navigation.navigate('Friends');
                        }}
                        icon={<Friends />}
                        text="Friends"
                    />
                </View>
                <View
                    onLayout={handleLayout('messages')}
                    style={styles.buttonContainer}
                >
                    <SidebarButton
                        onPress={() => {
                            setSelectedButton('messages');
                            navigation.navigate('Messages');
                        }}
                        icon={<Chat />}
                        text="Messages"
                    />
                </View>
                <View
                    onLayout={handleLayout('events')}
                    style={styles.buttonContainer}
                >
                    <SidebarButton
                        onPress={() => {
                            setSelectedButton('events');
                            navigation.navigate('Events');
                        }}
                        icon={<Events />}
                        text="Events"
                    />
                </View>
                <View
                    onLayout={handleLayout('search')}
                    style={styles.buttonContainer}
                >
                    <SidebarButton
                        onPress={() => {
                            setSelectedButton('search');
                            navigation.navigate('Search');
                        }}
                        icon={<Search />}
                        text="Search"
                    />
                </View>
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
                                  imageSource={{ uri: group.avatarUrl }}
                                  onPress={() => {
                                      setSelectedButton(group.name);
                                      navigation.navigate(group.name);
                                  }}
                                  groupName={group.name}
                              />
                          </View>
                      ))}
                <View
                    ref={createGroupRef}
                    onLayout={handleLayout('createGroup')}
                    style={styles.buttonContainer}
                >
                    <SidebarButton
                        onPress={() => {
                            setSelectedButton('createGroup');
                            navigation.navigate('CreateGroup');
                        }}
                        icon={<Add />}
                        text="Create Group"
                    />
                </View>
            </View>
        </ScrollView>
    );
};
