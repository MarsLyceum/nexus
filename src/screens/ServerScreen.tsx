// ServerScreen.tsx
import React, { useState } from 'react';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { COLORS } from '../constants';
import { ServerMessagesScreen } from './ServerMessagesScreen';
import { GroupEventsScreen } from './GroupEventsScreen';
import { Group, GroupChannel } from '../types';
import { Feed } from '../icons';

const styles = StyleSheet.create({
    largeScreenContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: COLORS.PrimaryBackground,
    },
    sidebarContainer: {
        width: 250,
        backgroundColor: COLORS.PrimaryBackground,
    },
    chatWrapper: {
        flex: 1,
        backgroundColor: COLORS.PrimaryBackground,
    },
    channelListContainer: {
        flex: 1,
        backgroundColor: COLORS.PrimaryBackground,
        padding: 20,
    },
    serverTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 20,
    },
    channelItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
    },
    activeChannelItemWrapper: {
        backgroundColor: COLORS.SecondaryBackground,
        padding: 4,
        marginVertical: 2,
        borderRadius: 5,
    },
    icon: {
        marginRight: 10,
    },
    channelText: {
        fontSize: 16,
        color: 'gray',
    },
    activeChannelText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

// Define the root stack's param list.
type RootStackParamList = {
    ServerMessages: { channel: GroupChannel; group: Group };
    GroupEvents: { group: Group };
};

// Create a unified navigation type alias.
type NavProp = NavigationProp<RootStackParamList>;

// Define props for ServerScreen.
type ServerScreenProps = {
    route: RouteProp<RootStackParamList, 'ServerMessages'>;
    navigation: NavProp;
};

type ActiveView = 'messages' | 'events';

type ChannelListProps = {
    group: Group;
    navigation: NavProp;
    activeChannel: GroupChannel | undefined;
    setActiveChannel: (channel: GroupChannel | undefined) => void;
    isLargeScreen: boolean;
    activeView: ActiveView;
    setActiveView: (view: ActiveView) => void;
};

const ChannelList: React.FC<ChannelListProps> = ({
    group,
    navigation,
    activeChannel,
    setActiveChannel,
    isLargeScreen,
    activeView,
    setActiveView,
}) => (
    <View style={styles.channelListContainer}>
        <Text style={styles.serverTitle}>{group.name}</Text>
        <FlatList
            data={group.channels}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <View
                    style={
                        activeChannel?.id === item.id
                            ? styles.activeChannelItemWrapper
                            : {}
                    }
                >
                    <TouchableOpacity
                        style={styles.channelItem}
                        onPress={() => {
                            setActiveChannel(item);
                            if (isLargeScreen) {
                                setActiveView('messages');
                            } else {
                                navigation.navigate('ServerMessages', {
                                    channel: item,
                                    group,
                                });
                            }
                        }}
                    >
                        {item.type === 'feed' ? (
                            <Feed style={styles.icon} />
                        ) : (
                            <Icon
                                name="comment"
                                size={16}
                                color={
                                    activeChannel?.id === item.id
                                        ? COLORS.White
                                        : COLORS.InactiveText
                                }
                                style={styles.icon}
                            />
                        )}
                        <Text
                            style={[
                                styles.channelText,
                                activeChannel?.id === item.id &&
                                    styles.activeChannelText,
                            ]}
                        >
                            {item.name}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        />

        {/* "Events" button without a fake channel */}
        <View
            style={
                activeView === 'events' ? styles.activeChannelItemWrapper : {}
            }
        >
            <TouchableOpacity
                style={styles.channelItem}
                onPress={() => {
                    if (isLargeScreen) {
                        // Clear activeChannel and set view to events.
                        setActiveChannel(undefined);
                        setActiveView('events');
                    } else {
                        navigation.navigate('GroupEvents', { group });
                    }
                }}
            >
                <Icon
                    name="calendar"
                    size={16}
                    color={
                        activeView === 'events'
                            ? COLORS.White
                            : COLORS.InactiveText
                    }
                    style={styles.icon}
                />
                <Text
                    style={[
                        styles.channelText,
                        activeView === 'events' && styles.activeChannelText,
                    ]}
                >
                    Events
                </Text>
            </TouchableOpacity>
        </View>
    </View>
);

export function ServerScreen({ navigation, route }: ServerScreenProps) {
    const { group } = route.params;
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;
    // Set the initial active channel to the first channel in the group.
    const [activeChannel, setActiveChannel] = useState<
        GroupChannel | undefined
    >(group.channels[0] || undefined);
    const [activeView, setActiveView] = useState<ActiveView>('messages');

    if (isLargeScreen) {
        return (
            <View style={styles.largeScreenContainer}>
                <View style={styles.sidebarContainer}>
                    <ChannelList
                        group={group}
                        navigation={navigation}
                        isLargeScreen={isLargeScreen}
                        activeChannel={activeChannel}
                        setActiveChannel={setActiveChannel}
                        activeView={activeView}
                        setActiveView={setActiveView}
                    />
                </View>
                <View style={styles.chatWrapper}>
                    {activeView === 'messages' ? (
                        // When activeView is 'messages', activeChannel should not be undefined.
                        <ServerMessagesScreen
                            route={route}
                            activeChannel={activeChannel!}
                            // @ts-expect-error type narrowing isn't working
                            navigation={
                                navigation as NavigationProp<
                                    RootStackParamList,
                                    'ServerMessages'
                                >
                            }
                        />
                    ) : (
                        <GroupEventsScreen navigation={navigation} />
                    )}
                </View>
            </View>
        );
    }

    // On smaller screens, render just the channel list.
    return (
        <ChannelList
            group={group}
            navigation={navigation}
            activeChannel={activeChannel}
            setActiveChannel={setActiveChannel}
            isLargeScreen={isLargeScreen}
            activeView={activeView}
            setActiveView={setActiveView}
        />
    );
}
