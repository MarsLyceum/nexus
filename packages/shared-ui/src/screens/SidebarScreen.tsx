import React, {
    useRef,
    useState,
    useEffect,
    useLayoutEffect,
    useMemo,
    useCallback,
} from 'react';
import { View, Animated, StyleSheet, ScrollView } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useApolloClient } from '@apollo/client';
import isEqual from 'lodash.isequal';

import { useNexusRouter } from '../hooks';
import {
    setUserGroups,
    useAppDispatch,
    useAppSelector,
    RootState,
    UserType,
    UserGroupsType,
} from '../redux';
import { GroupButton, SidebarButton } from '../buttons';
import {
    Friends,
    Chat,
    Events,
    Search,
    Add,
    Theme as ThemeIcon,
} from '../icons';
import { FETCH_USER_GROUPS_QUERY } from '../queries';
import { SIDEBAR_WIDTH } from '../constants';
import { getItem, setItem } from '../utils';
import { useTheme, Theme } from '../theme';

// Enhanced helper function to merge groups from cache and fetched data.
// It uses lodash.isequal for deep comparison and preserves object identity when possible.
const mergeGroups = (
    cached: UserGroupsType,
    fetched: UserGroupsType
): UserGroupsType => {
    // Create a map for quick lookup by id from the cached groups.
    const cachedMap = new Map<string, (typeof fetched)[number]>();
    cached.forEach((group) => {
        cachedMap.set(group.id, group);
    });

    return fetched.map((newGroup) => {
        const cachedGroup = cachedMap.get(newGroup.id);
        if (cachedGroup) {
            let changed = false;
            Object.keys(newGroup).forEach((key) => {
                if (
                    !isEqual(
                        newGroup[key as keyof typeof newGroup],
                        cachedGroup[key as keyof typeof cachedGroup]
                    )
                ) {
                    changed = true;
                }
            });
            return changed ? newGroup : cachedGroup;
        }
        return newGroup;
    });
};

const BUTTON_MARGIN_TOP = 32;
const CONTENT_PADDING_LEFT = 10;

function createStyles(theme: Theme) {
    return StyleSheet.create({
        sidebarContainer: {
            width: SIDEBAR_WIDTH,
            height: '100%',
            backgroundColor: theme.colors.AppBackground,
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
            backgroundColor: theme.colors.ActiveText,
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
            backgroundColor: theme.colors.InactiveText,
            marginRight: 10,
        },
        skeletonText: {
            width: 100,
            height: 16,
            borderRadius: 4,
            backgroundColor: theme.colors.InactiveText,
        },
    });
}

// Extend the props so that currentRoute is optional.
type SidebarScreenProps = DrawerContentComponentProps & {
    currentRoute?: string;
    groups?: UserGroupsType;
};

export const SidebarScreen = ({
    navigation,
    currentRoute,
    groups,
    state,
}: SidebarScreenProps) => {
    // If currentRoute is not provided, initialize from navigation state.
    const initialRoute =
        currentRoute ??
        (state?.routeNames ? state.routeNames[state.index] : 'friends');
    const [selectedButton, setSelectedButton] = useState<string>(initialRoute);
    const { theme } = useTheme();
    const router = useNexusRouter(navigation);
    const styles = useMemo(() => createStyles(theme), [theme]);

    // Update the selected button when currentRoute changes (if provided)
    useEffect(() => {
        if (currentRoute) {
            setSelectedButton(currentRoute.toLowerCase());
        }
    }, [currentRoute]);

    const user: UserType = useAppSelector(
        (stateInner: RootState) => stateInner.user.user
    );

    const handlePress = useCallback(
        (routeName: string) => {
            const normalizedRoute = routeName.toLowerCase();
            // Update the local selected route if currentRoute prop is not provided.
            if (!currentRoute) {
                setSelectedButton(normalizedRoute);
            }

            router.push(`/${normalizedRoute}`);
        },
        [currentRoute, router]
    );

    // Manage groups: if not passed via props, we use local state.
    // This state is initially empty but will be populated from cache immediately.
    const [localGroups, setLocalGroups] = useState<UserGroupsType>(
        groups || []
    );
    const [loadingGroups, setLoadingGroups] = useState<boolean>(!groups);

    const dispatch = useAppDispatch();
    const apolloClient = useApolloClient();

    // If groups prop changes, update the local state.
    useEffect(() => {
        if (groups) {
            setLocalGroups(groups);
            setLoadingGroups(false);
        }
    }, [groups]);

    // Load from cache first and then fetch new groups.
    useEffect(() => {
        if (!groups && user?.id) {
            void (async () => {
                // 1. Load cached groups so UI can render instantly.
                try {
                    const cachedGroupsStr = await getItem('userGroups');
                    if (cachedGroupsStr) {
                        const cachedGroups = JSON.parse(
                            cachedGroupsStr
                        ) as UserGroupsType;
                        setLocalGroups(cachedGroups);
                        dispatch(setUserGroups(cachedGroups));
                        setLoadingGroups(false);
                    }
                } catch (error) {
                    console.error('Error loading cached groups', error);
                }

                // 2. Fetch fresh groups from API.
                try {
                    const result = await apolloClient.query<{
                        fetchUserGroups: UserGroupsType;
                    }>({
                        query: FETCH_USER_GROUPS_QUERY,
                        variables: { userId: user.id },
                    });
                    const freshGroups = result.data.fetchUserGroups;
                    // 3. Merge fetched groups with cached ones to preserve object references.
                    setLocalGroups((prevGroups) => {
                        const mergedGroups = mergeGroups(
                            prevGroups,
                            freshGroups
                        );
                        // Consolidate updating both Redux state and local storage.
                        setTimeout(() => {
                            dispatch(setUserGroups(mergedGroups));
                        }, 0);
                        void setItem(
                            'userGroups',
                            JSON.stringify(mergedGroups)
                        );
                        return mergedGroups;
                    });
                    setLoadingGroups(false);
                } catch (error) {
                    console.error('Error fetching groups from API', error);
                }
            })();
        }
    }, [groups, user?.id, apolloClient, dispatch]);

    // Create dedicated refs for the static buttons.
    const staticButtonRefs = {
        friends: useRef<View>(null),
        messages: useRef<View>(null),
        events: useRef<View>(null),
        search: useRef<View>(null),
        creategroup: useRef<View>(null),
        theme: useRef<View>(null),
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
        // eslint-disable-next-line unicorn/no-null
        let buttonRef: React.RefObject<View | null> | null = null;
        if (staticButtonRefs[selectedButton as keyof typeof staticButtonRefs]) {
            buttonRef =
                staticButtonRefs[
                    selectedButton as keyof typeof staticButtonRefs
                ];
        } else if (dynamicButtonRefs.current[selectedButton]) {
            buttonRef = { current: dynamicButtonRefs.current[selectedButton] };
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                () => {
                    console.warn('measureLayout error');
                }
            );
        }
    }, [selectedButton, highlightTop, highlightHeight, staticButtonRefs]);

    const SkeletonGroupButton = () => (
        <View style={styles.skeletonButton}>
            <View style={styles.skeletonAvatar} />
            <View style={styles.skeletonText} />
        </View>
    );

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
                        onPress={() => handlePress('friends')}
                        icon={<Friends />}
                        text="Friends"
                    />
                </View>
                <View
                    ref={staticButtonRefs.messages}
                    style={styles.buttonContainer}
                >
                    <SidebarButton
                        onPress={() => handlePress('messages')}
                        icon={<Chat />}
                        text="Messages"
                    />
                </View>
                <View
                    ref={staticButtonRefs.events}
                    style={styles.buttonContainer}
                >
                    <SidebarButton
                        onPress={() => handlePress('events')}
                        icon={<Events />}
                        text="Events"
                    />
                </View>
                <View
                    ref={staticButtonRefs.search}
                    style={styles.buttonContainer}
                >
                    <SidebarButton
                        onPress={() => handlePress('search')}
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
                                      onPress={() => handlePress(group.name)}
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
                        onPress={() => handlePress('create-group')}
                        icon={<Add />}
                        text="Create Group"
                    />
                </View>

                <View
                    ref={staticButtonRefs.theme}
                    style={styles.buttonContainer}
                >
                    <SidebarButton
                        onPress={() => handlePress('theme')}
                        icon={<ThemeIcon />}
                        text="Change Theme"
                    />
                </View>
            </View>
        </ScrollView>
    );
};
