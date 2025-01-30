import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { EventCard } from '../cards';

const events = [
    {
        id: '1',
        title: 'NashJS: The Art of Giving and Receiving Feedback with: Chris Leonard',
        dateTime: 'Wed, Jan 29 · 5:30 PM',
        groupName: 'NashJS - Nashville Javascript',
        attendees: 25,
        location: 'Vaco Nashville',
        imageUrl: 'https://source.unsplash.com/200x100/?meeting,conference',
    },
    {
        id: '2',
        title: 'React Native Meetup: Building Mobile Apps Efficiently',
        dateTime: 'Fri, Feb 10 · 6:00 PM',
        groupName: 'React Native Nashville',
        attendees: 42,
        location: 'Tech Hub Nashville',
        imageUrl: 'https://source.unsplash.com/200x100/?tech,event',
    },
];

export const EventsScreen: React.FC = () => {
    return (
        <View style={styles.container}>
            <FlatList
                data={events}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <EventCard {...item} />}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: '#1E1E1E',
    },
});
