// ServerScreen.tsx
import React, { useState, useContext, useEffect } from 'react';
import { NavigationProp } from '@react-navigation/native';
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
import { ActiveGroupContext } from '../providers';

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
    ServerMessages: undefined;
    GroupEvents: { group: Group };
};

type NavProp = NavigationProp<RootStackParamList>;

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
            renderItem={({ item }) => {
                // Only highlight a channel if the view is "messages" and this channel is the active one.
                const isActiveChannel =
                    activeView === 'messages' && activeChannel?.id === item.id;
                return (
                    <View
                        style={
                            isActiveChannel
                                ? styles.activeChannelItemWrapper
                                : undefined
                        }
                    >
                        <TouchableOpacity
                            style={styles.channelItem}
                            onPress={() => {
                                setActiveChannel(item);
                                if (isLargeScreen) {
                                    setActiveView('messages');
                                } else {
                                    // On smaller screens, navigate without passing the channel in the route.
                                    navigation.navigate('ServerMessages');
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
                                        isActiveChannel
                                            ? COLORS.White
                                            : COLORS.InactiveText
                                    }
                                    style={styles.icon}
                                />
                            )}
                            <Text
                                style={[
                                    styles.channelText,
                                    isActiveChannel && styles.activeChannelText,
                                ]}
                            >
                                {item.name}
                            </Text>
                        </TouchableOpacity>
                    </View>
                );
            }}
        />

        {/* "Events" button */}
        <View
            style={
                activeView === 'events'
                    ? styles.activeChannelItemWrapper
                    : undefined
            }
        >
            <TouchableOpacity
                style={styles.channelItem}
                onPress={() => {
                    if (isLargeScreen) {
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

export function ServerScreen({ navigation }: { navigation: NavProp }) {
    const { activeGroup, activeChannel, setActiveChannel } =
        useContext(ActiveGroupContext);
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;
    const [activeView, setActiveView] = useState<ActiveView>('messages');

    // When an active group becomes available and no active channel is set, use the first channel.
    useEffect(() => {
        if (activeGroup && !activeChannel) {
            setActiveChannel(activeGroup.channels[0] || undefined);
        }
    }, [activeGroup, activeChannel, setActiveChannel]);

    if (!activeGroup) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: COLORS.PrimaryBackground,
                }}
            >
                <Text style={{ color: COLORS.White }}>
                    No active group selected.
                </Text>
            </View>
        );
    }

    if (isLargeScreen) {
        return (
            <View style={styles.largeScreenContainer}>
                <View style={styles.sidebarContainer}>
                    <ChannelList
                        group={activeGroup}
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
                        // ServerMessagesScreen retrieves the active channel from context.
                        <ServerMessagesScreen navigation={navigation} />
                    ) : (
                        <GroupEventsScreen
                            navigation={navigation}
                            group={activeGroup}
                        />
                    )}
                </View>
            </View>
        );
    }

    // On smaller screens, render just the channel list.
    return (
        <ChannelList
            group={activeGroup}
            navigation={navigation}
            activeChannel={activeChannel}
            setActiveChannel={setActiveChannel}
            isLargeScreen={isLargeScreen}
            activeView={activeView}
            setActiveView={setActiveView}
        />
    );
}
