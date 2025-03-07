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
import { Feed, Chat, Events } from '../icons';
import { ActiveGroupContext } from '../providers';

const styles = StyleSheet.create({
    largeScreenContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: COLORS.PrimaryBackground,
    },
    sidebarContainer: {
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
        fontFamily: 'Roboto_700Bold',
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 10,
    },
    memberInfo: {
        fontSize: 12,
        color: 'white',
        marginBottom: 10,
    },
    groupDescription: {
        fontFamily: 'Roboto_400Regular',
        fontSize: 14,
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
}) => {
    // Define mock data for member and online counts
    const mockMemberCount = 123;
    const mockOnlineCount = 45;

    // Render a channel item (always in full view)
    const renderChannelItem = ({ item }: { item: GroupChannel }) => {
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
                            navigation.navigate('ServerMessages');
                        }
                    }}
                >
                    {item.type === 'feed' ? (
                        <Feed
                            style={styles.icon}
                            color={
                                isActiveChannel
                                    ? COLORS.White
                                    : COLORS.InactiveText
                            }
                        />
                    ) : (
                        <Chat
                            style={styles.icon}
                            color={
                                isActiveChannel
                                    ? COLORS.White
                                    : COLORS.InactiveText
                            }
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
    };

    return (
        <View style={styles.channelListContainer}>
            <Text style={styles.serverTitle}>{group.name}</Text>
            <Text style={styles.memberInfo}>
                {`${mockMemberCount} members ${mockOnlineCount} online`}
            </Text>
            <Text style={styles.groupDescription}>
                {group.description ||
                    'Join us as we explore the boundaries of innovation and collaboration! Our community thrives on sharing ideas, inspiring creativity, and building a better future together.'}
            </Text>
            <FlatList
                data={group.channels}
                keyExtractor={(item) => item.id}
                renderItem={renderChannelItem}
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
                    <Events
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
};

export function GroupScreen({ navigation }: { navigation: NavProp }) {
    const { activeGroup, activeChannel, setActiveChannel } =
        useContext(ActiveGroupContext);
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;
    const [activeView, setActiveView] = useState<ActiveView>('messages');

    // When an active group becomes available and no active channel is set, use the first channel.
    useEffect(() => {
        if (activeGroup?.channels && activeGroup?.channels.length > 0) {
            // Check if the current activeChannel belongs to the activeGroup.
            const channelExists = activeChannel
                ? activeGroup.channels.some(
                      (channel) => channel.id === activeChannel.id
                  )
                : false;
            // If not, select the first channel from the new group.
            if (!channelExists) {
                setActiveChannel(activeGroup.channels[0]);
            }
        } else {
            // If there are no channels, clear the active channel.
            setActiveChannel(undefined);
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
                <View style={[styles.sidebarContainer, { width: 250 }]}>
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
                        // @ts-expect-error navigation
                        <ServerMessagesScreen navigation={navigation} />
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
