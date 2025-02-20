// EventCard.tsx
import React, { useState } from 'react';
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
import { Image as ExpoImage } from 'expo-image';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import { COLORS } from '../constants';
import { BackArrow } from '../buttons';

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.PrimaryBackground,
        borderRadius: 8,
        padding: 15,
        marginVertical: 10,
        alignSelf: 'center',
        width: '100%', // Adjust card width so it doesn't span too wide on mobile
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
        color: 'white',
    },
    dateTime: {
        fontSize: 14,
        color: COLORS.AccentText,
        marginVertical: 2,
    },
    groupName: {
        fontSize: 14,
        color: 'white',
    },
    attendees: {
        fontSize: 12,
        color: 'gray',
        marginBottom: 8,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
    },
    addressText: {
        fontSize: 14,
        color: COLORS.AccentText,
        marginLeft: 5,
    },
    description: {
        fontSize: 14,
        color: '#ddd',
        marginVertical: 10,
        lineHeight: 20,
    },
    rsvpButton: {
        backgroundColor: COLORS.Primary,
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
        color: COLORS.White,
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
        backgroundColor: COLORS.PrimaryBackground,
        borderRadius: 8,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
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
        color: 'white',
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
        color: 'white',
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
        borderColor: COLORS.PrimaryBackground,
    },
});

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
    // Local state for RSVP status
    const [joined, setJoined] = useState(false);

    // Get screen dimensions to adjust layout on small screens
    const { width: screenWidth } = useWindowDimensions();
    const isSmallScreen = screenWidth < 768; // Adjust threshold as needed

    // Toggle RSVP state
    const handleRsvp = () => {
        setJoined((prev) => !prev);
        if (onRsvp) {
            onRsvp();
        }
    };

    // Open external map using the provided address
    const handleOpenMap = () => {
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            location
        )}`;
        // Simply call the function in a block (no void operator)
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        onPress && handleOpenMap;
        // eslint-disable-next-line no-lone-blocks
        {
            handleOpenMap();
        }
        // Alternatively, just call:
        // handleOpenMap();
        // eslint-disable-next-line no-void
        void Linking.openURL(url);
    };

    // Function to add the event to the calendar
    const handleAddEventToCalendar = async () => {
        try {
            // Parse start and end dates (assuming a 2‑hour event)
            const startDate = new Date(dateTime);
            const endDate = new Date(startDate);
            endDate.setHours(endDate.getHours() + 2);

            // For web/desktop, use a Google Calendar URL as a fallback
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

            // For native mobile platforms, request calendar permissions
            const { status } = await Calendar.requestCalendarPermissionsAsync();
            // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Denied',
                    'Calendar permission is required to add events.'
                );
                return;
            }

            // Get modifiable calendars
            const calendars = await Calendar.getCalendarsAsync(
                Calendar.EntityTypes.EVENT
            );
            let defaultCalendar = calendars.find(
                (cal) => cal.allowsModifications
            );

            // If no modifiable calendar is found, attempt to create one
            if (!defaultCalendar) {
                let defaultCalendarSource;
                // eslint-disable-next-line unicorn/prefer-ternary
                if (Platform.OS === 'ios') {
                    defaultCalendarSource =
                        // eslint-disable-next-line unicorn/no-await-expression-member
                        (await Calendar.getDefaultCalendarAsync()).source;
                } else {
                    // For Android, use a local source
                    defaultCalendarSource = {
                        isLocalAccount: true,
                        name: 'Expo Calendar',
                        id: '1', // dummy id if needed
                        type: 'local',
                    };
                }
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
                // Cast to a minimal calendar object with an id.
                defaultCalendar = { id: newCalendarId } as Calendar.Calendar;
            }

            // Create the event details
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

    // Mock event description for the details view
    const mockDescription =
        "Join us for an immersive event where you'll have the opportunity to connect with industry leaders, participate in engaging workshops, and gain valuable insights into the latest trends. This event promises to be an inspiring experience with interactive sessions, networking opportunities, and much more.";

    // Mock data for hosts and going lists with profile pictures from Lorem Picsum.
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

    // State for controlling the modal view for full lists
    const [modalVisible, setModalVisible] = useState(false);
    const [modalListType, setModalListType] = useState<
        'hosts' | 'going' | undefined
    >();

    const openModal = (listType: 'hosts' | 'going') => {
        setModalListType(listType);
        setModalVisible(true);
    };

    // Render overlapping (stacked) profile pictures
    const renderStackedProfiles = (people: Person[]) => (
        <View style={styles.stackedProfilesContainer}>
            {people.map((person, index) => (
                <ExpoImage
                    key={person.id}
                    source={{ uri: person.imageUrl }}
                    style={[
                        styles.profileImage,
                        { marginLeft: index === 0 ? 0 : -10 },
                    ]}
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
                    {/* Date/time area wrapped in a touchable to add to calendar */}
                    <TouchableOpacity
                        onPress={() => {
                            // eslint-disable-next-line no-void
                            void handleAddEventToCalendar();
                        }}
                    >
                        <Text style={styles.dateTime}>{dateTime}</Text>
                    </TouchableOpacity>
                    {!hideGroupName && (
                        <Text style={styles.groupName}>{groupName}</Text>
                    )}
                    <Text style={styles.attendees}>{attendees} going</Text>
                    {/* Clickable address row */}
                    <TouchableOpacity onPress={handleOpenMap}>
                        <View style={styles.addressRow}>
                            <FontAwesome
                                name="map-marker"
                                size={16}
                                color={COLORS.AccentText}
                            />
                            <Text style={styles.addressText}>{location}</Text>
                        </View>
                    </TouchableOpacity>
                    {/* Event Description (Details view only) */}
                    {preview === false && (
                        <Text style={styles.description}>
                            {mockDescription}
                        </Text>
                    )}
                    {/* Stacked profile pictures for Hosts and Going (Details view only) */}
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
                            <FontAwesome
                                name={joined ? 'times-circle' : 'check-circle'}
                                size={16}
                                color={COLORS.White}
                            />
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
                <ExpoImage
                    source={{ uri: imageUrl }}
                    style={[
                        styles.eventImage,
                        isSmallScreen && {
                            width: '100%',
                            height: 200,
                            marginTop: 10,
                        },
                    ]}
                />
            </View>
        </View>
    );

    // Create a safely typed list for the modal mapping.
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
            {/* Modal to display the full list of profiles */}
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
                                    <ExpoImage
                                        source={{ uri: person.imageUrl }}
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
                            <Text style={{ color: COLORS.Primary }}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
};
