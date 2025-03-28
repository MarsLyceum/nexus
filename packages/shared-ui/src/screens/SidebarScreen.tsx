import React, {
    useRef,
    useState,
    useEffect,
    useLayoutEffect,
    useCallback,
} from 'react';
import { View, Animated, StyleSheet, ScrollView } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useApolloClient } from '@apollo/client';
import { useRouter } from 'solito/navigation';

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
import { COLORS, SIDEBAR_WIDTH } from '../constants';

import { detectEnvironment, Environment } from '../utils';

const BUTTON_MARGIN_TOP = 32;
const CONTENT_PADDING_LEFT = 10;

const styles = StyleSheet.create({
    sidebarContainer: {
        width: SIDEBAR_WIDTH,
        height: '100%',
        backgroundColor: COLORS.AppBackground,
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        overflow: 'hidden',
    },
    sidebarButtonsContainer: {
        position: 'relative',
    },
    buttonContainer: {
        marginBottom: 16,
    },
    highlight: {
        position: 'absolute',
        left: -CONTENT_PADDING_LEFT,
        width: 4,
        backgroundColor: COLORS.OffWhite,
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        zIndex: 999,
    },
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

const SkeletonGroupButton = () => (
    <View style={styles.skeletonButton}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonText} />
    </View>
);

// Extend the props to accept an optional groups list.
type SidebarScreenProps = DrawerContentComponentProps & {
    currentRoute: string;
    groups?: UserGroupsType;
};

// eslint-disable-next-line react/display-name
export const SidebarScreen = React.memo(
    ({ navigation, currentRoute, groups }: SidebarScreenProps) => {
        const router = useRouter();
        const [selectedButton, setSelectedButton] =
            useState<string>(currentRoute);

        // Update the selected button when currentRoute changes.
        useEffect(() => {
            setSelectedButton(currentRoute);
        }, [currentRoute]);

        const user: UserType = useAppSelector(
            (state: RootState) => state.user.user
        );

        // State for groups: use passed prop if available, else default to an empty array.
        const [localGroups, setLocalGroups] = useState<UserGroupsType>(
            groups || []
        );
        // Only show loading if groups prop is not passed.
        const [loadingGroups, setLoadingGroups] = useState<boolean>(!groups);

        const dispatch = useAppDispatch();
        const apolloClient = useApolloClient();

        // If groups prop is provided, update localGroups when it changes.
        useEffect(() => {
            if (groups) {
                setLocalGroups(groups);
                setLoadingGroups(false);
            }
        }, [groups]);

        // Only fetch groups if not provided via props.
        useEffect(() => {
            void (async () => {
                if (!groups && user?.id) {
                    const result = await apolloClient.query<{
                        fetchUserGroups: UserGroupsType;
                    }>({
                        query: FETCH_USER_GROUPS_QUERY,
                        variables: { userId: user.id },
                    });
                    // Optionally update redux store if needed.
                    dispatch(retrieveUserGroups(result.data.fetchUserGroups));
                    setLocalGroups(result.data.fetchUserGroups);
                    setLoadingGroups(false);
                }
            })();
        }, [groups, user?.id, apolloClient, dispatch]);

        // Create dedicated refs for the static buttons.
        const staticButtonRefs = {
            friends: useRef<View>(null),
            messages: useRef<View>(null),
            events: useRef<View>(null),
            search: useRef<View>(null),
            creategroup: useRef<View>(null),
        };

        // Create a dictionary for dynamic group button refs.
        const dynamicButtonRefs = useRef<{ [key: string]: View | null }>({});

        // Container ref for measuring.
        const sidebarButtonsContainerRef = useRef<View>(null);

        // Initialize animated values.
        const highlightTop = useRef(new Animated.Value(0)).current;
        const highlightHeight = useRef(new Animated.Value(40)).current;

        // Measure the currently selected button.
        useLayoutEffect(() => {
            let buttonRef: React.RefObject<View> | null = null;
            if (
                staticButtonRefs[
                    selectedButton as keyof typeof staticButtonRefs
                ]
            ) {
                buttonRef =
                    staticButtonRefs[
                        selectedButton as keyof typeof staticButtonRefs
                    ];
            } else if (dynamicButtonRefs.current[selectedButton]) {
                buttonRef = {
                    current: dynamicButtonRefs.current[selectedButton],
                };
            }

            if (
                buttonRef &&
                buttonRef.current &&
                sidebarButtonsContainerRef.current
            ) {
                buttonRef.current.measureLayout(
                    sidebarButtonsContainerRef.current,
                    (x, y, width, height) => {
                        Animated.spring(highlightTop, {
                            toValue: y,
                            useNativeDriver: false,
                        }).start();
                        Animated.spring(highlightHeight, {
                            toValue: height,
                            useNativeDriver: false,
                        }).start();
                    },
                    (error) => {
                        console.warn('measureLayout error:', error);
                    }
                );
            }
        }, [selectedButton, highlightTop, highlightHeight]);

        // Navigation helper.
        const handlePress = (routeName: string) => {
            const normalizedRoute = routeName.toLowerCase();
            const env: Environment = detectEnvironment();
            if (env === 'nextjs-client' || env === 'nextjs-server') {
                router.push(`/dashboard/${normalizedRoute}`);
            } else {
                navigation.navigate(routeName);
            }
        };

        return (
            <ScrollView
                style={styles.sidebarContainer}
                contentContainerStyle={{
                    paddingTop: BUTTON_MARGIN_TOP,
                    paddingLeft: CONTENT_PADDING_LEFT,
                }}
            >
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
                        ref={staticButtonRefs.friends}
                        style={styles.buttonContainer}
                    >
                        <SidebarButton
                            onPress={() => handlePress('Friends')}
                            icon={<Friends />}
                            text="Friends"
                        />
                    </View>
                    <View
                        ref={staticButtonRefs.messages}
                        style={styles.buttonContainer}
                    >
                        <SidebarButton
                            onPress={() => handlePress('Messages')}
                            icon={<Chat />}
                            text="Messages"
                        />
                    </View>
                    <View
                        ref={staticButtonRefs.events}
                        style={styles.buttonContainer}
                    >
                        <SidebarButton
                            onPress={() => handlePress('Events')}
                            icon={<Events />}
                            text="Events"
                        />
                    </View>
                    <View
                        ref={staticButtonRefs.search}
                        style={styles.buttonContainer}
                    >
                        <SidebarButton
                            onPress={() => handlePress('Search')}
                            icon={<Search />}
                            text="Search"
                        />
                    </View>
                    {/* Render dynamic group buttons */}
                    {loadingGroups
                        ? [0, 1, 2].map((placeholder) => (
                              <View
                                  style={styles.buttonContainer}
                                  key={`skeleton-${placeholder}`}
                              >
                                  <SkeletonGroupButton />
                              </View>
                          ))
                        : localGroups.map((group) => {
                              const key = group.name.toLowerCase();
                              return (
                                  <View
                                      key={group.id}
                                      style={styles.buttonContainer}
                                      // Store the dynamic button ref.
                                      ref={(ref) => {
                                          dynamicButtonRefs.current[key] = ref;
                                      }}
                                  >
                                      <GroupButton
                                          imageSource={group.avatarUrl ?? ''}
                                          onPress={() =>
                                              handlePress(group.name)
                                          }
                                          groupName={group.name}
                                      />
                                  </View>
                              );
                          })}
                    <View
                        ref={staticButtonRefs.creategroup}
                        style={styles.buttonContainer}
                    >
                        <SidebarButton
                            onPress={() => handlePress('CreateGroup')}
                            icon={<Add />}
                            text="Create Group"
                        />
                    </View>
                </View>
            </ScrollView>
        );
    }
);
