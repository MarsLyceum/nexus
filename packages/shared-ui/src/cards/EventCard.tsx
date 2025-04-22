// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable max-lines */
import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
    Linking,
    Alert,
    Platform,
    useWindowDimensions,
} from 'react-native';
import * as Calendar from 'expo-calendar';
import Svg, { Path } from 'react-native-svg';

import { NexusImage } from '../small-components';
import { useTheme, Theme } from '../theme';
import { BackArrow } from '../buttons';

// Custom SVG Icons (using paths from FontAwesome)
export const MapMarkerIcon: React.FC<{ size: number; color: string }> = ({
    size,
    color,
}) => (
    <Svg width={size} height={size} viewBox="0 0 384 512" fill={color}>
        <Path d="M172.268 501.67C27.347 300.11 0 269.01 0 192 0 85.96 85.96 0 192 0s192 85.96 192 192c0 77.01-27.347 108.11-172.268 309.67-9.535 13.43-30.464 13.43-40 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z" />
    </Svg>
);

export const TimesCircleIcon: React.FC<{ size: number; color: string }> = ({
    size,
    color,
}) => (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
        <Path d="M256 8C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm121.6 313.6c4.8 4.8 4.8 12.8 0 17.6l-22.4 22.4c-4.8 4.8-12.8 4.8-17.6 0L256 295.3l-81.6 81.6c-4.8 4.8-12.8 4.8-17.6 0l-22.4-22.4c-4.8-4.8-4.8-12.8 0-17.6L215.3 256l-81.6-81.6c-4.8-4.8-4.8-12.8 0-17.6l22.4-22.4c4.8-4.8 12.8-4.8 17.6 0L256 216.7l81.6-81.6c4.8-4.8 12.8-4.8 17.6 0l22.4 22.4c4.8 4.8 4.8 12.8 0 17.6L296.7 256l81.6 81.6z" />
    </Svg>
);

export const CheckCircleIcon: React.FC<{ size: number; color: string }> = ({
    size,
    color,
}) => (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
        <Path d="M256 8C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm-37.3 350.3l-99.6-99.6c-4.7-4.7-4.7-12.3 0-17l22.6-22.6c4.7-4.7 12.3-4.7 17 0L219 286.1l144.3-144.3c4.7-4.7 12.3-4.7 17 0l22.6 22.6c4.7 4.7 4.7 12.3 0 17L235.7 358.3c-4.7 4.7-12.3 4.7-17 0z" />
    </Svg>
);

function createStyles(theme: Theme) {
    return StyleSheet.create({
        card: {
            backgroundColor: theme.colors.PrimaryBackground,
            borderRadius: 8,
            padding: 15,
            marginVertical: 10,
            alignSelf: 'center',
            width: '100%',
        },
        titleRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10,
        },
        backArrow: {
            marginRight: 10,
        },
        topRow: {
            flexDirection: 'row',
            alignItems: 'flex-start',
        },
        textContainer: {
            flex: 1,
            marginRight: 10,
        },
        title: {
            fontSize: 16,
            fontWeight: 'bold',
            color: theme.colors.ActiveText,
        },
        dateTime: {
            fontSize: 14,
            color: theme.colors.AccentText,
            marginVertical: 2,
        },
        groupName: {
            fontSize: 14,
            color: theme.colors.ActiveText,
        },
        attendees: {
            fontSize: 12,
            color: theme.colors.InactiveText,
            marginBottom: 8,
        },
        addressRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: 8,
        },
        addressText: {
            fontSize: 14,
            color: theme.colors.AccentText,
            marginLeft: 5,
        },
        description: {
            fontSize: 14,
            color: theme.colors.ActiveText,
            marginVertical: 10,
            lineHeight: 20,
        },
        rsvpButton: {
            backgroundColor: theme.colors.Primary,
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 5,
            alignSelf: 'flex-start',
            marginTop: 10,
        },
        rsvpButtonContent: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        rsvpButtonText: {
            color: theme.colors.ActiveText,
            fontSize: 12,
            fontWeight: 'bold',
        },
        eventImage: {
            width: 140,
            height: 105,
            borderRadius: 5,
            alignSelf: 'flex-start',
        },
        modalContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        modalContent: {
            width: '80%',
            backgroundColor: theme.colors.PrimaryBackground,
            borderRadius: 8,
            padding: 20,
        },
        modalTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.ActiveText,
            marginBottom: 10,
        },
        modalItemContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: 5,
        },
        profilePic: {
            width: 40,
            height: 40,
            borderRadius: 20,
            marginRight: 10,
        },
        modalItemText: {
            fontSize: 16,
            color: theme.colors.ActiveText,
        },
        closeButton: {
            marginTop: 20,
            alignSelf: 'flex-end',
        },
        profilesContainer: {
            marginVertical: 8,
        },
        profileRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: 4,
        },
        profileLabel: {
            fontSize: 14,
            color: theme.colors.ActiveText,
            marginRight: 8,
        },
        stackedProfilesContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        profileImage: {
            width: 40,
            height: 40,
            borderRadius: 20,
            borderWidth: 2,
            borderColor: theme.colors.PrimaryBackground,
        },
    });
}

type Person = {
    id: number;
    name: string;
    imageUrl: string;
};

type EventCardProps = {
    title: string;
    dateTime: string;
    groupName: string;
    attendees: number;
    location: string;
    imageUrl: string;
    hideGroupName?: boolean;
    onBackPress?: () => void;
    onPress?: () => void;
    onRsvp?: () => void;
    preview?: boolean;
};

export const EventCard: React.FC<EventCardProps> = ({
    title,
    dateTime,
    groupName,
    attendees,
    location,
    imageUrl,
    hideGroupName,
    onBackPress,
    onPress,
    onRsvp,
    preview = false,
}) => {
    const [joined, setJoined] = useState(false);
    const { width: screenWidth } = useWindowDimensions();
    const isSmallScreen = screenWidth < 768;
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    // Event image dimensions (140×105 on larger screens; full width & 200 height on small screens)
    const eventImageWidth = isSmallScreen ? screenWidth : 140;
    const eventImageHeight = isSmallScreen ? 200 : 105;

    const handleRsvp = () => {
        setJoined((prev) => !prev);
        if (onRsvp) {
            onRsvp();
        }
    };

    const handleOpenMap = () => {
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            location
        )}`;
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        onPress && handleOpenMap;
        // eslint-disable-next-line no-lone-blocks
        {
            handleOpenMap();
        }
        void Linking.openURL(url);
    };

    const handleAddEventToCalendar = async () => {
        try {
            const startDate = new Date(dateTime);
            const endDate = new Date(startDate);
            endDate.setHours(endDate.getHours() + 2);

            if (Platform.OS === 'web') {
                const formatDate = (date: Date) =>
                    `${date.toISOString().replaceAll(/[.:-]/g, '').split('Z')[0]}Z`;
                const startStr = formatDate(startDate);
                const endStr = formatDate(endDate);
                const googleCalendarUrl = `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(
                    title
                )}&dates=${startStr}/${endStr}&details=${encodeURIComponent(
                    mockDescription
                )}&location=${encodeURIComponent(location)}`;
                await Linking.openURL(googleCalendarUrl);
                return;
            }

            const { status } = await Calendar.requestCalendarPermissionsAsync();
            // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Denied',
                    'Calendar permission is required to add events.'
                );
                return;
            }

            const calendars = await Calendar.getCalendarsAsync(
                Calendar.EntityTypes.EVENT
            );
            let defaultCalendar = calendars.find(
                (cal) => cal.allowsModifications
            );

            if (!defaultCalendar) {
                const defaultCalendarSource =
                    Platform.OS === 'ios'
                        ? // eslint-disable-next-line unicorn/no-await-expression-member
                          (await Calendar.getDefaultCalendarAsync()).source
                        : {
                              isLocalAccount: true,
                              name: 'Expo Calendar',
                              id: '1',
                              type: 'local',
                          };
                const newCalendarId = await Calendar.createCalendarAsync({
                    title: 'Expo Calendar',
                    color: '#2196F3',
                    entityType: Calendar.EntityTypes.EVENT,
                    sourceId: defaultCalendarSource.id,
                    source: defaultCalendarSource,
                    name: 'Expo Calendar',
                    ownerAccount: '',
                    accessLevel: Calendar.CalendarAccessLevel.OWNER,
                });
                defaultCalendar = { id: newCalendarId } as Calendar.Calendar;
            }

            const eventDetails = {
                title,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                location,
                notes: mockDescription,
            };

            await Calendar.createEventAsync(defaultCalendar.id, eventDetails);
            Alert.alert('Event added to your calendar!');
        } catch (error: unknown) {
            console.error(
                'Error adding event to calendar:',
                error instanceof Error ? error.message : error
            );
            Alert.alert('Error', 'Could not add event to calendar');
        }
    };

    const mockDescription =
        "Join us for an immersive event where you'll have the opportunity to connect with industry leaders, participate in engaging workshops, and gain valuable insights into the latest trends. This event promises to be an inspiring experience with interactive sessions, networking opportunities, and much more.";

    const hosts: Person[] = [
        {
            id: 1,
            name: 'Alice Johnson',
            imageUrl: 'https://picsum.photos/seed/alice/40',
        },
        {
            id: 2,
            name: 'Bob Smith',
            imageUrl: 'https://picsum.photos/seed/bob/40',
        },
    ];

    const goingList: Person[] = [
        {
            id: 3,
            name: 'Charlie Brown',
            imageUrl: 'https://picsum.photos/seed/charlie/40',
        },
        {
            id: 4,
            name: 'Dana White',
            imageUrl: 'https://picsum.photos/seed/dana/40',
        },
        {
            id: 5,
            name: 'Eve Black',
            imageUrl: 'https://picsum.photos/seed/eve/40',
        },
        {
            id: 6,
            name: 'Frank Green',
            imageUrl: 'https://picsum.photos/seed/frank/40',
        },
    ];

    const [modalVisible, setModalVisible] = useState(false);
    const [modalListType, setModalListType] = useState<
        'hosts' | 'going' | undefined
    >();

    const openModal = (listType: 'hosts' | 'going') => {
        setModalListType(listType);
        setModalVisible(true);
    };

    const renderStackedProfiles = (people: Person[]) => (
        <View style={styles.stackedProfilesContainer}>
            {people.map((person, index) => (
                <NexusImage
                    key={person.id}
                    source={person.imageUrl}
                    alt={`${person.name} profile`}
                    width={40}
                    height={40}
                    style={StyleSheet.flatten([
                        styles.profileImage,
                        { marginLeft: index === 0 ? 0 : -10 },
                    ])}
                />
            ))}
        </View>
    );

    const cardElement = (
        <View style={styles.card}>
            <View
                style={[
                    styles.topRow,
                    isSmallScreen && {
                        flexDirection: 'column',
                        alignItems: 'center',
                    },
                ]}
            >
                <View
                    style={[
                        styles.textContainer,
                        isSmallScreen && { marginRight: 0 },
                    ]}
                >
                    <View style={styles.titleRow}>
                        {onBackPress && (
                            <BackArrow
                                onPress={onBackPress}
                                style={styles.backArrow}
                            />
                        )}
                        <Text style={styles.title}>{title}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => void handleAddEventToCalendar()}
                    >
                        <Text style={styles.dateTime}>{dateTime}</Text>
                    </TouchableOpacity>
                    {!hideGroupName && (
                        <Text style={styles.groupName}>{groupName}</Text>
                    )}
                    <Text style={styles.attendees}>{attendees} going</Text>
                    <TouchableOpacity onPress={handleOpenMap}>
                        <View style={styles.addressRow}>
                            <MapMarkerIcon
                                size={16}
                                color={theme.colors.AccentText}
                            />
                            <Text style={styles.addressText}>{location}</Text>
                        </View>
                    </TouchableOpacity>
                    {preview === false && (
                        <Text style={styles.description}>
                            {mockDescription}
                        </Text>
                    )}
                    {preview === false && (
                        <View style={styles.profilesContainer}>
                            <TouchableOpacity
                                onPress={() => openModal('hosts')}
                            >
                                <View style={styles.profileRow}>
                                    <Text style={styles.profileLabel}>
                                        Hosts
                                    </Text>
                                    {renderStackedProfiles(hosts)}
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => openModal('going')}
                            >
                                <View style={styles.profileRow}>
                                    <Text style={styles.profileLabel}>
                                        Going
                                    </Text>
                                    {renderStackedProfiles(goingList)}
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}
                    <TouchableOpacity
                        style={styles.rsvpButton}
                        onPress={handleRsvp}
                    >
                        <View style={styles.rsvpButtonContent}>
                            {joined ? (
                                <TimesCircleIcon
                                    size={16}
                                    color={theme.colors.ActiveText}
                                />
                            ) : (
                                <CheckCircleIcon
                                    size={16}
                                    color={theme.colors.ActiveText}
                                />
                            )}
                            <Text
                                style={[
                                    styles.rsvpButtonText,
                                    { marginLeft: 5 },
                                ]}
                            >
                                {joined ? "Can't make it" : 'Join in'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <NexusImage
                    source={imageUrl}
                    alt="Event image"
                    width={eventImageWidth}
                    height={eventImageHeight}
                    style={StyleSheet.flatten([
                        styles.eventImage,
                        isSmallScreen
                            ? {
                                  width: eventImageWidth,
                                  height: eventImageHeight,
                                  marginTop: 10,
                              }
                            : {},
                    ])}
                />
            </View>
        </View>
    );

    const modalList: Person[] =
        modalListType === 'hosts'
            ? hosts
            : modalListType === 'going'
              ? goingList
              : [];

    return (
        <>
            {onPress ? (
                <TouchableOpacity onPress={onPress}>
                    {cardElement}
                </TouchableOpacity>
            ) : (
                cardElement
            )}
            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setModalVisible(false);
                    setModalListType(undefined);
                }}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {modalListType === 'hosts' ? 'Hosts' : 'Going'}
                        </Text>
                        <ScrollView>
                            {modalList.map((person) => (
                                <View
                                    key={person.id}
                                    style={styles.modalItemContainer}
                                >
                                    <NexusImage
                                        source={person.imageUrl}
                                        alt={`${person.name} profile`}
                                        width={40}
                                        height={40}
                                        style={styles.profilePic}
                                    />
                                    <Text style={styles.modalItemText}>
                                        {person.name}
                                    </Text>
                                </View>
                            ))}
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => {
                                setModalVisible(false);
                                setModalListType(undefined);
                            }}
                        >
                            <Text style={{ color: theme.colors.Primary }}>
                                Close
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
};
