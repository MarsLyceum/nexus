import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

interface EventCardProps {
    title: string;
    dateTime: string;
    groupName: string;
    attendees: number;
    location: string;
    imageUrl: string;
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: COLORS.PrimaryBackground,
        borderRadius: 10,
        padding: 15,
        marginVertical: 10,
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    dateTime: {
        fontSize: 14,
        color: COLORS.AccentText,
        marginVertical: 5,
    },
    groupName: {
        fontSize: 14,
        color: 'white',
    },
    attendees: {
        fontSize: 12,
        color: 'gray',
    },
    eventImage: {
        width: 80,
        height: 60,
        borderRadius: 5,
        marginLeft: 10,
    },
});

export const EventCard: React.FC<EventCardProps> = ({
    title,
    dateTime,
    groupName,
    attendees,
    location,
    imageUrl,
}) => (
    <View style={styles.card}>
        <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.dateTime}>{dateTime}</Text>
            <Text style={styles.groupName}>{groupName}</Text>
            <Text style={styles.attendees}>
                {attendees} going · {location}
            </Text>
        </View>
        <Image source={{ uri: imageUrl }} style={styles.eventImage} />
    </View>
);
