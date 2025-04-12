import React, { useState, useContext, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    useWindowDimensions,
    Platform,
} from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useTheme, Theme } from '../theme';
import { Group, GroupChannel } from '../types';
import { Feed, Chat, Events } from '../icons';
import { ActiveGroupContext } from '../providers';
import { useNexusRouter } from '../hooks';

import { GroupChannelScreen } from './GroupChannelScreen';
import { GroupEventsScreen } from './GroupEventsScreen';

function createStyles(theme: Theme) {
    return StyleSheet.create({
        largeScreenContainer: {
            flex: 1,
            flexDirection: 'row',
            backgroundColor: theme.colors.PrimaryBackground,
            height: '100%',
        },
        sidebarContainer: {
            backgroundColor: theme.colors.PrimaryBackground,
        },
        chatWrapper: {
            flex: 1,
            backgroundColor: theme.colors.PrimaryBackground,
        },
        channelListContainer: {
            flex: 1,
            backgroundColor: theme.colors.PrimaryBackground,
            padding: 20,
        },
        serverTitle: {
            fontSize: 20,
            fontFamily: 'Roboto_700Bold',
            fontWeight: 'bold',
            color: theme.colors.ActiveText,
            marginBottom: 10,
        },
        memberInfo: {
            fontSize: 12,
            color: theme.colors.ActiveText,
            marginBottom: 10,
        },
        groupDescription: {
            fontFamily: 'Roboto_400Regular',
            fontSize: 14,
            color: theme.colors.ActiveText,
            marginBottom: 20,
        },
        channelItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10,
            paddingHorizontal: 8,
        },
        activeChannelItemWrapper: {
            backgroundColor: theme.colors.SecondaryBackground,
            padding: 4,
            marginVertical: 2,
            borderRadius: 5,
        },
        icon: {
            marginRight: 10,
        },
        channelText: {
            fontSize: 16,
            fontFamily: 'Roboto_400Regular',
            color: theme.colors.MainText,
        },
        activeChannelText: {
            color: theme.colors.ActiveText,
            fontWeight: 'bold',
            fontFamily: 'Roboto_700Bold',
        },
    });
}

type ActiveView = 'messages' | 'events';

type ChannelListProps = {
    group: Group;
    activeChannel: GroupChannel | undefined;
    setActiveChannel: (channel: GroupChannel | undefined) => void;
    isLargeScreen: boolean;
    activeView: ActiveView;
    setActiveView: (view: ActiveView) => void;
    styles: ReturnType<typeof createStyles>;
};

export function GroupScreen() {
    const { activeGroup, activeChannel, setActiveChannel } =
        useContext(ActiveGroupContext);
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;
    const [activeView, setActiveView] = useState<ActiveView>('messages');
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    // When an active group becomes available and no active channel is set, use the first channel.
    useEffect(() => {
        if (activeGroup?.channels && activeGroup?.channels.length > 0) {
            const channelExists = activeChannel
                ? activeGroup.channels.some(
                      (channel) => channel.id === activeChannel.id
                  )
                : false;
            if (!channelExists) {
                setActiveChannel(activeGroup.channels[0]);
            }
        } else {
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
                    backgroundColor: theme.colors.PrimaryBackground,
                }}
            >
                <Text style={{ color: theme.colors.ActiveText }}>
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
                        isLargeScreen={isLargeScreen}
                        activeChannel={activeChannel}
                        setActiveChannel={setActiveChannel}
                        activeView={activeView}
                        setActiveView={setActiveView}
                        styles={styles}
                    />
                </View>
                <View style={styles.chatWrapper}>
                    {activeView === 'messages' ? (
                        <GroupChannelScreen />
                    ) : (
                        <GroupEventsScreen />
                    )}
                </View>
            </View>
        );
    }

    return (
        <ChannelList
            group={activeGroup}
            activeChannel={activeChannel}
            setActiveChannel={setActiveChannel}
            isLargeScreen={isLargeScreen}
            activeView={activeView}
            setActiveView={setActiveView}
            styles={styles}
        />
    );
}

const ChannelList: React.FC<ChannelListProps> = ({
    group,
    activeChannel,
    setActiveChannel,
    isLargeScreen,
    activeView,
    setActiveView,
    styles,
}) => {
    // Get the router for navigation
    const router = useNexusRouter();

    // Mock data for member and online counts.
    const mockMemberCount = 123;
    const mockOnlineCount = 45;

    // Local state for channel order.
    const [channels, setChannels] = useState<GroupChannel[]>(group.channels);
    const { theme } = useTheme();

    // Update local channels if the group prop changes.
    useEffect(() => {
        setChannels(group.channels);
    }, [group.channels]);

    // Setup sensors for dnd-kit (web).
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    // Web drag-end handler.
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = channels.findIndex(
                (item) => item.id === active.id
            );
            const newIndex = channels.findIndex((item) => item.id === over.id);
            setChannels(arrayMove(channels, oldIndex, newIndex));
        }
    };

    // Mobile: Render draggable channel item.
    const renderDraggableChannelItem = ({
        item,
        drag,
    }: {
        item: GroupChannel;
        drag: () => void;
    }) => {
        const isActive =
            activeView === 'messages' && activeChannel?.id === item.id;
        return (
            <TouchableOpacity
                onLongPress={drag}
                onPress={() => {
                    setActiveChannel(item);
                    if (isLargeScreen) {
                        setActiveView('messages');
                    } else {
                        router.push('/group-channel');
                    }
                }}
                style={isActive ? styles.activeChannelItemWrapper : undefined}
            >
                <View style={styles.channelItem}>
                    {item.type === 'feed' ? (
                        <Feed
                            style={styles.icon}
                            color={
                                isActive
                                    ? theme.colors.ActiveText
                                    : theme.colors.InactiveText
                            }
                        />
                    ) : (
                        <Chat
                            style={styles.icon}
                            color={
                                isActive
                                    ? theme.colors.ActiveText
                                    : theme.colors.InactiveText
                            }
                        />
                    )}
                    <Text
                        style={[
                            styles.channelText,
                            isActive && styles.activeChannelText,
                        ]}
                    >
                        {item.name}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    // Web: Create a sortable channel item using dnd-kit's useSortable hook.
    type SortableChannelItemProps = {
        id: string;
        channel: GroupChannel;
        isActive: boolean;
        onPress: () => void;
    };

    const SortableChannelItem: React.FC<SortableChannelItemProps> = ({
        id,
        channel,
        isActive,
        onPress,
    }) => {
        const { attributes, listeners, setNodeRef, transform, transition } =
            useSortable({ id });
        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
            cursor: 'grab',
        };
        return (
            // @ts-expect-error web only styles
            <View
                ref={setNodeRef}
                style={[
                    isActive ? styles.activeChannelItemWrapper : undefined,
                    style,
                ]}
                {...attributes}
                {...listeners}
            >
                <TouchableOpacity onPress={onPress} style={styles.channelItem}>
                    {channel.type === 'feed' ? (
                        <Feed
                            style={styles.icon}
                            color={
                                isActive
                                    ? theme.colors.ActiveText
                                    : theme.colors.InactiveText
                            }
                        />
                    ) : (
                        <Chat
                            style={styles.icon}
                            color={
                                isActive
                                    ? theme.colors.ActiveText
                                    : theme.colors.InactiveText
                            }
                        />
                    )}
                    <Text
                        style={[
                            styles.channelText,
                            isActive && styles.activeChannelText,
                        ]}
                    >
                        {channel.name}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.channelListContainer}>
            <Text style={styles.serverTitle}>{group.name}</Text>
            <Text
                style={styles.memberInfo}
            >{`${mockMemberCount} members ${mockOnlineCount} online`}</Text>
            <Text style={styles.groupDescription}>
                {group.description ||
                    'Join us as we explore the boundaries of innovation and collaboration! Our community thrives on sharing ideas, inspiring creativity, and building a better future together.'}
            </Text>

            {/* Container for the channels list */}
            <View style={{ flex: 1 }}>
                {Platform.OS === 'web' ? (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={channels.map((item) => item.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {channels.map((channel) => {
                                const isActive =
                                    activeView === 'messages' &&
                                    activeChannel?.id === channel.id;
                                return (
                                    <SortableChannelItem
                                        key={channel.id}
                                        id={channel.id}
                                        channel={channel}
                                        isActive={isActive}
                                        onPress={() => {
                                            setActiveChannel(channel);
                                            if (isLargeScreen) {
                                                setActiveView('messages');
                                            } else {
                                                router.push('/group-channel');
                                            }
                                        }}
                                    />
                                );
                            })}
                        </SortableContext>
                    </DndContext>
                ) : (
                    <DraggableFlatList
                        data={channels}
                        keyExtractor={(item) => item.id}
                        renderItem={renderDraggableChannelItem}
                        onDragEnd={({ data }) => setChannels(data)}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                )}
            </View>

            {/* Container for the "Events" button pinned at the bottom */}
            <View style={{ marginTop: 'auto' }}>
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
                                router.push('/GroupEvents', { group });
                            }
                        }}
                    >
                        <Events
                            color={
                                activeView === 'events'
                                    ? theme.colors.ActiveText
                                    : theme.colors.InactiveText
                            }
                            style={styles.icon}
                        />
                        <Text
                            style={[
                                styles.channelText,
                                activeView === 'events' &&
                                    styles.activeChannelText,
                            ]}
                        >
                            Events
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};
