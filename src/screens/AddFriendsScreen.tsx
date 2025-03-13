import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Image,
    useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/core';
import { useQuery } from '@apollo/client';

import { useAppSelector, RootState, UserType } from '../redux';
import { COLORS } from '../constants';
import { BackArrow } from '../buttons';
import { SEARCH_FOR_USERS_QUERY, GET_FRIENDS_QUERY } from '../queries'; // Adjust paths as needed

export const AddFriendsScreen = () => {
    // State for the text input and the actual search query
    const [inputText, setInputText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const navigation = useNavigation();
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;

    const user: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );

    // Query to fetch users based on the searchQuery state
    const {
        data: searchData,
        loading: searchLoading,
        error: searchError,
    } = useQuery(SEARCH_FOR_USERS_QUERY, {
        variables: { searchQuery },
        skip: searchQuery.trim() === '',
    });

    // Query to fetch current user's friends list
    const {
        data: friendsData,
        loading: friendsLoading,
        error: friendsError,
    } = useQuery(GET_FRIENDS_QUERY, {
        variables: { userId: user?.id },
    });

    // Extract search results and friends list
    const searchResults = searchData ? searchData.searchForUsers : [];
    const friendIds = new Set(
        friendsData ? friendsData.getFriends.map((item) => item.friend.id) : []
    );

    // Render a single search result item
    const renderFriendItem = ({ item }) => (
        <View style={styles.friendItem}>
            <Image
                source={{
                    uri: `https://picsum.photos/seed/${item.username}/40`,
                }}
                style={styles.avatar}
            />
            <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{item.username}</Text>
                <Text style={styles.friendFullName}>
                    {item.firstName} {item.lastName}
                </Text>
            </View>
            {/* Only show the add button if this user is not already a friend and is not the logged-in user */}
            {!friendIds.has(item.id) && item.id !== user?.id && (
                <TouchableOpacity style={styles.addButton}>
                    <Text style={styles.addButtonText}>Add Friend</Text>
                </TouchableOpacity>
            )}
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
                placeholder="Search for user"
                placeholderTextColor={COLORS.InactiveText}
                value={inputText}
                onChangeText={setInputText}
                // Trigger search on pressing enter
                onSubmitEditing={() => setSearchQuery(inputText)}
                autoComplete="off"
                textContentType="none"
                data-lpignore="true"
                importantForAutofill="no"
            />
            {(searchLoading || friendsLoading) && (
                <ActivityIndicator
                    size="large"
                    color={COLORS.Primary}
                    style={{ marginVertical: 16 }}
                />
            )}
            {(searchError || friendsError) && (
                <Text style={{ color: 'red', marginVertical: 16 }}>
                    Error fetching data.
                </Text>
            )}
            <FlatList
                data={searchResults}
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
    friendFullName: {
        color: COLORS.White,
        fontSize: 14,
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
