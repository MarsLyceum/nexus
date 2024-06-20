import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

// Define the component
export const FriendsScreen = () => {
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>Web Page Header</Text>
            </View>
            <View style={styles.content}>
                <Text style={styles.contentText}>
                    This is a boilerplate component representing a web page.
                </Text>
                {/* Add more content here */}
            </View>
        </ScrollView>
    );
};

// Define the styles
const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    header: {
        backgroundColor: '#4CAF50',
        padding: 20,
        borderRadius: 5,
        marginBottom: 20,
    },
    headerText: {
        fontSize: 24,
        color: '#fff',
        fontWeight: 'bold',
    },
    content: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 5,
    },
    contentText: {
        fontSize: 16,
        color: '#333',
    },
});
