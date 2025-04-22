// GroupEventsScreen.tsx
import React, { useState, useMemo } from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    Button,
    useWindowDimensions,
} from 'react-native';

import { useNexusRouter } from '../hooks';
import { EventCard } from '../cards';
import { Header } from '../sections';
import { useAppSelector, RootState, UserType } from '../redux';
import { Event } from '../types';
import { useTheme, Theme } from '../theme';

const initialEvents: Event[] = [
    {
        id: '1',
        title: 'NashJS: The Art of Giving and Receiving Feedback with: Chris Leonard',
        dateTime: 'Wed, Jan 29 · 5:30 PM',
        groupName: 'NashJS - Nashville Javascript',
        attendees: 25,
        location: 'Vaco Nashville',
        imageUrl: 'https://picsum.photos/200/100?random=1',
        postedByUser: {
            username: 'Suerg',
        },
    },
    {
        id: '2',
        title: 'React Native Meetup: Building Mobile Apps Efficiently',
        dateTime: 'Fri, Feb 10 · 6:00 PM',
        groupName: 'React Native Nashville',
        attendees: 42,
        location: 'Tech Hub Nashville',
        imageUrl: 'https://picsum.photos/200/100?random=2',
        postedByUser: {
            username: 'Suerg',
        },
    },
];

export const GroupEventsScreen = () => {
    const router = useNexusRouter();
    // State management for events and modal visibility
    const [events, setEvents] = useState(initialEvents);
    const [modalVisible, setModalVisible] = useState(false);
    const { width } = useWindowDimensions();

    // State for new event inputs
    const [title, setTitle] = useState('');
    const [dateTime, setDateTime] = useState('');
    const [groupName, setGroupName] = useState('');
    const [attendees, setAttendees] = useState('');
    const [location, setLocation] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const user: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );

    // Adds a new event to the list
    const handleAddEvent = () => {
        const newEvent: Event = {
            id: String(Date.now()), // Unique ID based on timestamp
            title: title || 'Untitled Event',
            dateTime: dateTime || 'TBA',
            groupName: groupName || 'Unknown Group',
            attendees: Number.parseInt(attendees, 10) || 0,
            location: location || 'Location TBD',
            imageUrl: imageUrl || 'https://picsum.photos/200/100',
            postedByUser: {
                username: user?.username,
            },
        };

        setEvents([...events, newEvent]);
        // Reset the form fields and close the modal
        setTitle('');
        setDateTime('');
        setGroupName('');
        setAttendees('');
        setLocation('');
        setImageUrl('');
        setModalVisible(false);
    };

    return (
        <View style={styles.container}>
            <Header isLargeScreen={width > 768} headerText="Events" />

            <FlatList
                data={events}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <EventCard
                        hideGroupName
                        {...item}
                        onPress={() =>
                            router.push('/event-details', { event: item })
                        }
                        preview
                    />
                )}
                contentContainerStyle={styles.eventList}
            />

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>

            {/* Modal for creating a new event */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Create New Event</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Title"
                            placeholderTextColor={theme.colors.InactiveText}
                            value={title}
                            onChangeText={setTitle}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Date & Time"
                            placeholderTextColor={theme.colors.InactiveText}
                            value={dateTime}
                            onChangeText={setDateTime}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Group Name"
                            placeholderTextColor={theme.colors.InactiveText}
                            value={groupName}
                            onChangeText={setGroupName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Attendees"
                            placeholderTextColor={theme.colors.InactiveText}
                            value={attendees}
                            onChangeText={setAttendees}
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Location"
                            placeholderTextColor={theme.colors.InactiveText}
                            value={location}
                            onChangeText={setLocation}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Image URL (optional)"
                            placeholderTextColor={theme.colors.InactiveText}
                            value={imageUrl}
                            onChangeText={setImageUrl}
                        />
                        <View style={styles.buttonContainer}>
                            <Button
                                title="Cancel"
                                onPress={() => setModalVisible(false)}
                                color={theme.colors.Primary}
                            />
                            <Button
                                title="Create"
                                onPress={handleAddEvent}
                                color={theme.colors.Primary}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.SecondaryBackground,
        },
        fab: {
            position: 'absolute',
            bottom: 20,
            right: 20,
            backgroundColor: theme.colors.Primary,
            width: 60,
            height: 60,
            borderRadius: 30,
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 5,
        },
        fabIcon: {
            fontSize: 30,
            color: theme.colors.ActiveText,
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        modalContainer: {
            width: '80%',
            backgroundColor: theme.colors.AppBackground,
            padding: 20,
            borderRadius: 10,
            elevation: 10,
        },
        modalTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            marginBottom: 20,
            textAlign: 'center',
            color: theme.colors.ActiveText,
        },
        input: {
            height: 40,
            backgroundColor: theme.colors.TextInput,
            borderColor: theme.colors.Primary,
            borderWidth: 1,
            borderRadius: 5,
            marginBottom: 15,
            paddingHorizontal: 10,
            color: theme.colors.ActiveText,
        },
        buttonContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
        },
        eventList: {
            padding: 15,
        },
    });
}
