import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import { COLORS } from '../constants';
import { BackArrow } from '../buttons';

const styles = StyleSheet.create({
    backArrow: {
        marginRight: 10,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    // The card now has a column layout
    card: {
        backgroundColor: COLORS.PrimaryBackground,
        borderRadius: 10,
        padding: 15,
        marginVertical: 10,
    },
    // The top row contains the text and the image side by side
    topRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    // Text container takes up the remaining space on the left
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
    // The event image remains on the right in the top row.
    eventImage: {
        width: 140, // increased by ~75%
        height: 105, // increased by ~75%
        borderRadius: 5,
        alignSelf: 'flex-start',
    },
    // The map container is now placed below the top row and spans the full width.
    mapContainer: {
        marginTop: 10,
    },
    // Map style for both web and native.
    map: {
        width: '100%',
        height: 200,
        borderRadius: 10,
    },
});

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
    onRsvp?: () => void; // Optional callback for additional RSVP actions
    /**
     * If set to false, a map view will be shown inside the event details.
     * Defaults to true.
     */
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
    // Local state to track RSVP status
    const [joined, setJoined] = useState(false);

    // Handler to toggle RSVP state
    const handleRsvp = () => {
        setJoined((prev) => !prev);
        if (onRsvp) {
            onRsvp();
        }
    };

    // Define coordinates for the map (can be made dynamic or passed as props)
    const latitude = 37.78825;
    const longitude = -122.4324;
    const latDelta = 0.0922;
    const lonDelta = 0.0421;
    const minLat = latitude - latDelta / 2;
    const maxLat = latitude + latDelta / 2;
    const minLon = longitude - lonDelta / 2;
    const maxLon = longitude + lonDelta / 2;

    const openStreetMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${minLon},${minLat},${maxLon},${maxLat}&layer=mapnik&marker=${latitude},${longitude}`;

    // Build the event card: top row for text and image; map below
    const cardElement = (
        <View style={styles.card}>
            <View style={styles.topRow}>
                <View style={styles.textContainer}>
                    <View style={styles.titleRow}>
                        {onBackPress && (
                            <BackArrow
                                onPress={onBackPress}
                                style={styles.backArrow}
                            />
                        )}
                        <Text style={styles.title}>{title}</Text>
                    </View>
                    <Text style={styles.dateTime}>{dateTime}</Text>
                    {!hideGroupName && (
                        <Text style={styles.groupName}>{groupName}</Text>
                    )}
                    <Text style={styles.attendees}>
                        {attendees} going · {location}
                    </Text>
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
                <Image source={{ uri: imageUrl }} style={styles.eventImage} />
            </View>
            {preview === false && (
                <View style={styles.mapContainer}>
                    {Platform.OS === 'web' ? (
                        <iframe
                            title="map"
                            width="100%"
                            height="200"
                            style={{ border: 0, borderRadius: 10 }}
                            loading="lazy"
                            src={openStreetMapUrl}
                        ></iframe>
                    ) : (
                        <WebView
                            style={styles.map}
                            source={{ uri: openStreetMapUrl }}
                        />
                    )}
                </View>
            )}
        </View>
    );

    return onPress ? (
        <TouchableOpacity onPress={onPress}>{cardElement}</TouchableOpacity>
    ) : (
        cardElement
    );
};
