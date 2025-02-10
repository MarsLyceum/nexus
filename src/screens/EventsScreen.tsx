// EventsScreen.tsx
import React, { useContext } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { EventCard } from '../cards';
import { COLORS } from '../constants';
import { SearchContext } from '../providers';
import { useSearchFilter } from '../hooks';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: COLORS.SecondaryBackground,
    },
});

const events = [
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

export const EventsScreen: React.FC = () => {
    // Get the shared search text from the context.
    const { searchText } = useContext(SearchContext);

    // Filter events based on the search text matching title, groupName, or location.
    const filteredEvents = useSearchFilter(events, searchText, [
        'title',
        'groupName',
        'location',
    ]);

    return (
        <View style={styles.container}>
            <FlatList
                data={filteredEvents}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <EventCard {...item} preview />}
            />
        </View>
    );
};
