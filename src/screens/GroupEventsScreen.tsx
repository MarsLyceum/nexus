import React, { useState } from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    Button,
} from 'react-native';
import { EventCard } from '../cards';
import { COLORS } from '../constants';

const initialEvents = [
    {
        id: '1',
        title: 'NashJS: The Art of Giving and Receiving Feedback with: Chris Leonard',
        dateTime: 'Wed, Jan 29 · 5:30 PM',
        groupName: 'NashJS - Nashville Javascript',
        attendees: 25,
        location: 'Vaco Nashville',
        imageUrl: 'https://picsum.photos/200/100?random=1',
    },
    {
        id: '2',
        title: 'React Native Meetup: Building Mobile Apps Efficiently',
        dateTime: 'Fri, Feb 10 · 6:00 PM',
        groupName: 'React Native Nashville',
        attendees: 42,
        location: 'Tech Hub Nashville',
        imageUrl: 'https://picsum.photos/200/100?random=2',
    },
];

export const GroupEventsScreen: React.FC = ({ navigation }) => {
    // State management for events and modal visibility
    const [events, setEvents] = useState(initialEvents);
    const [modalVisible, setModalVisible] = useState(false);

    // State for new event inputs
    const [title, setTitle] = useState('');
    const [dateTime, setDateTime] = useState('');
    const [groupName, setGroupName] = useState('');
    const [attendees, setAttendees] = useState('');
    const [location, setLocation] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    // Adds a new event to the list
    const handleAddEvent = () => {
        const newEvent = {
            id: String(Date.now()), // Unique ID based on timestamp
            title: title || 'Untitled Event',
            dateTime: dateTime || 'TBA',
            groupName: groupName || 'Unknown Group',
            attendees: parseInt(attendees, 10) || 0,
            location: location || 'Location TBD',
            imageUrl: imageUrl || 'https://picsum.photos/200/100',
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
            <FlatList
                data={events}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <EventCard
                        hideGroupName
                        {...item}
                        onPress={() =>
                            navigation.navigate('EventDetails', {
                                event: item,
                            })
                        }
                        preview
                    />
                )}
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
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Create New Event</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Title"
                            placeholderTextColor={COLORS.InactiveText}
                            value={title}
                            onChangeText={setTitle}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Date & Time"
                            placeholderTextColor={COLORS.InactiveText}
                            value={dateTime}
                            onChangeText={setDateTime}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Group Name"
                            placeholderTextColor={COLORS.InactiveText}
                            value={groupName}
                            onChangeText={setGroupName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Attendees"
                            placeholderTextColor={COLORS.InactiveText}
                            value={attendees}
                            onChangeText={setAttendees}
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Location"
                            placeholderTextColor={COLORS.InactiveText}
                            value={location}
                            onChangeText={setLocation}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Image URL (optional)"
                            placeholderTextColor={COLORS.InactiveText}
                            value={imageUrl}
                            onChangeText={setImageUrl}
                        />
                        <View style={styles.buttonContainer}>
                            <Button
                                title="Cancel"
                                onPress={() => setModalVisible(false)}
                                color={COLORS.Primary}
                            />
                            <Button
                                title="Create"
                                onPress={handleAddEvent}
                                color={COLORS.Primary}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: COLORS.SecondaryBackground,
    },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: COLORS.Primary,
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
    },
    fabIcon: {
        fontSize: 30,
        color: COLORS.White,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '80%',
        backgroundColor: COLORS.AppBackground,
        padding: 20,
        borderRadius: 10,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: COLORS.White,
    },
    input: {
        height: 40,
        backgroundColor: COLORS.TextInput,
        borderColor: COLORS.Primary,
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 15,
        paddingHorizontal: 10,
        color: COLORS.White,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
});
