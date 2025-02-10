// ServerScreen.tsx
import React, { useState } from 'react';
import { NavigationProp, RouteProp } from '@react-navigation/core';
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

type RootStackParamList = {
    ServerMessages: { channel: GroupChannel; group: Group };
    GroupEvents: { group: Group };
};

type ServerScreenProps = {
    route: RouteProp<RootStackParamList, 'ServerMessages'>;
    navigation: NavigationProp<RootStackParamList, 'ServerMessages'>;
};

type ActiveView = 'messages' | 'events';

type ChannelListProps = {
    group: Group;
    navigation: NavigationProp<Record<string, unknown>>;
    activeChannel: GroupChannel;
    setActiveChannel: (channel: GroupChannel) => void;
    isLargeScreen: boolean;
    activeView: ActiveView;
    setActiveView: (view: ActiveView) => void;
};

const ChannelList = ({
    group,
    navigation,
    activeChannel,
    setActiveChannel,
    isLargeScreen,
    setActiveView,
}: ChannelListProps) => (
    <View style={styles.channelListContainer}>
        <Text style={styles.serverTitle}>{group.name}</Text>
        <FlatList
            data={group.channels}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <View
                    style={[
                        activeChannel.id === item.id &&
                            styles.activeChannelItemWrapper,
                    ]}
                >
                    <TouchableOpacity
                        style={styles.channelItem}
                        onPress={() => {
                            // When a regular channel is selected, update activeChannel and show messages.
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
                                    activeChannel.id === item.id
                                        ? COLORS.White
                                        : COLORS.InactiveText
                                }
                                style={styles.icon}
                            />
                        )}
                        <Text
                            style={[
                                styles.channelText,
                                activeChannel.id === item.id &&
                                    styles.activeChannelText,
                            ]}
                        >
                            {item.name}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        />

        {/* "Events" channel button styled exactly like a regular channel */}
        <View
            style={
                activeChannel.id === 'events'
                    ? styles.activeChannelItemWrapper
                    : {}
            }
        >
            <TouchableOpacity
                style={styles.channelItem}
                onPress={() => {
                    if (isLargeScreen) {
                        // Set the active channel to a special "events" channel and update the view.
                        setActiveChannel({
                            id: 'events',
                            name: 'Events',
                            type: 'events',
                        });
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
                        activeChannel.id === 'events'
                            ? COLORS.White
                            : COLORS.InactiveText
                    }
                    style={styles.icon}
                />
                <Text
                    style={[
                        styles.channelText,
                        activeChannel.id === 'events' &&
                            styles.activeChannelText,
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
    // Set initial active channel to the first channel of the group.
    const [activeChannel, setActiveChannel] = useState(group.channels[0]);
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
                        <ServerMessagesScreen
                            route={route}
                            activeChannel={activeChannel}
                            navigation={navigation}
                        />
                    ) : (
                        <GroupEventsScreen navigation={navigation} />
                    )}
                </View>
            </View>
        );
    }

    // On smaller screens, we use navigation for both messages and events.
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
