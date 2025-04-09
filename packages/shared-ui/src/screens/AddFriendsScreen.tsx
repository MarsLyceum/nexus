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
import { useQuery, useMutation } from '@apollo/client';

import { useNexusRouter } from '../hooks';
import { useAppSelector, RootState, UserType } from '../redux';
import { COLORS } from '../constants';
import { BackArrow } from '../buttons';
import {
    SEARCH_FOR_USERS_QUERY,
    GET_FRIENDS,
    SEND_FRIEND_REQUEST,
} from '../queries';

export const AddFriendsScreen = () => {
    // State for the text input and the actual search query.
    const [inputText, setInputText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    // Replace useNavigation with solito's router.
    const router = useNexusRouter();
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;

    const user: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );

    // Query to fetch users based on the searchQuery state.
    const {
        data: searchData,
        loading: searchLoading,
        error: searchError,
    } = useQuery(SEARCH_FOR_USERS_QUERY, {
        variables: { searchQuery },
        skip: searchQuery.trim() === '',
    });

    // Query to fetch current user's friends list.
    const {
        data: friendsData,
        loading: friendsLoading,
        error: friendsError,
    } = useQuery(GET_FRIENDS, {
        variables: { userId: user?.id },
    });

    // Mutation to send a friend request.
    const [
        sendFriendRequest,
        { loading: sendRequestLoading, error: sendRequestError },
    ] = useMutation(SEND_FRIEND_REQUEST, {
        refetchQueries: [
            { query: GET_FRIENDS, variables: { userId: user?.id } },
        ],
    });

    // Extract search results and friend IDs.
    const searchResults = searchData ? searchData.searchForUsers : [];
    const friendIds = new Set(
        friendsData
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              friendsData.getFriends.map((item: any) => item.friend.id)
            : []
    );

    // Function to handle adding a friend.
    const handleAddFriend = async (friendUserId: string) => {
        try {
            await sendFriendRequest({
                variables: { userId: user?.id, friendUserId },
            });
        } catch (error) {
            console.error('Error sending friend request:', error);
        }
    };

    // Render a single search result item.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderFriendItem = ({ item }: { item: any }) => (
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
            {/* Show the Add Friend button only if this user is not already a friend and is not the logged-in user */}
            {!friendIds.has(item.id) && item.id !== user?.id && (
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleAddFriend(item.id)}
                    disabled={sendRequestLoading}
                >
                    <Text style={styles.addButtonText}>
                        {sendRequestLoading ? 'Sending...' : 'Add Friend'}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.searchHeader}>
                {!isLargeScreen && (
                    <BackArrow onPress={() => router.goBack()} />
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
            {(searchError || friendsError || sendRequestError) && (
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
