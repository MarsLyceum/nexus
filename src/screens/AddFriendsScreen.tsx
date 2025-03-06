import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Image,
    useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/core';

import { COLORS } from '../constants';
import { BackArrow } from '../buttons';

// Example dataset for available friends
const availableFriends = [
    {
        id: '1',
        username: 'alex',
        email: 'alex@example.com',
        avatarUrl: 'https://picsum.photos/seed/alex/40',
    },
    {
        id: '2',
        username: 'moth',
        email: 'moth@example.com',
        avatarUrl: 'https://picsum.photos/seed/moth/40',
    },
    {
        id: '3',
        username: 'geno',
        email: 'geno@example.com',
        avatarUrl: 'https://picsum.photos/seed/geno/40',
    },
    // ... add more friend objects as needed
];

export const AddFriendsScreen = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const navigation = useNavigation();
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;

    // Filter available friends by matching username or email (case-insensitive)
    const filteredFriends = availableFriends.filter((friend) => {
        const lowerQuery = searchQuery.toLowerCase();
        return (
            friend.username.toLowerCase().includes(lowerQuery) ||
            friend.email.toLowerCase().includes(lowerQuery)
        );
    });

    // Render a single friend item
    const renderFriendItem = ({ item }) => (
        <View style={styles.friendItem}>
            <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
            <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{item.username}</Text>
                <Text style={styles.friendEmail}>{item.email}</Text>
            </View>
            <TouchableOpacity style={styles.addButton}>
                <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchHeader}>
                {!isLargeScreen && (
                    <BackArrow onPress={() => navigation.goBack()} />
                )}
                <Text style={styles.headerTitle}>Add Friend</Text>
            </View>
            <TextInput
                style={styles.searchBox}
                placeholder="Search by email or username"
                placeholderTextColor="#AAAAAA"
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            <FlatList
                data={filteredFriends}
                keyExtractor={(item) => item.id}
                renderItem={renderFriendItem}
                contentContainerStyle={styles.listContainer}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.SecondaryBackground,
        padding: 16,
    },
    searchBox: {
        backgroundColor: COLORS.TextInput,
        borderRadius: 8,
        padding: 12,
        color: COLORS.White,
        marginBottom: 16,
    },
    listContainer: {
        paddingBottom: 16,
    },
    friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.PrimaryBackground,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    friendInfo: {
        flex: 1,
        marginLeft: 12,
    },
    friendName: {
        color: COLORS.White,
        fontWeight: 'bold',
        fontFamily: 'Roboto_700Bold',
        fontSize: 16,
    },
    friendEmail: {
        color: COLORS.InactiveText,
        fontSize: 14,
    },
    addButton: {
        backgroundColor: COLORS.Primary,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 4,
    },
    addButtonText: {
        color: COLORS.White,
        fontWeight: 'bold',
        fontFamily: 'Roboto_700Bold',
    },
    searchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        width: '100%',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'left',
        color: COLORS.White,
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'Roboto_700Bold',
    },
});
