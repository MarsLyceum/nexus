// SearchScreen.tsx
import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { COLORS } from '../constants';
import { SearchBox } from '../sections';

type SearchResult = {
    id: number;
    subreddit: string;
    time: string;
    title: string;
    upvotes: string;
    comments: string;
};

// Some mock search results
const MOCK_RESULTS: SearchResult[] = [
    {
        id: 1,
        subreddit: 'r/gaming',
        time: '1y',
        title: "I think it's time to slowly step away from PC gaming",
        upvotes: '0',
        comments: '275',
    },
    {
        id: 2,
        subreddit: 'r/SubredditDrama',
        time: '5y',
        title: '/r/pcgaming reacts to the /r/Games shutdown',
        upvotes: '7.6k',
        comments: '3.0k',
    },
    {
        id: 3,
        subreddit: 'r/pcmasterrace',
        time: '1y',
        title: 'Is pc gaming no longer affordable?',
        upvotes: '2.0k',
        comments: '1.6k',
    },
    {
        id: 4,
        subreddit: 'r/pcgaming',
        time: '7d',
        title: 'Hot take: PC gaming kinda sucks right now',
        upvotes: '0',
        comments: '59',
    },
    {
        id: 5,
        subreddit: 'r/pcgaming',
        time: '1y',
        title: 'When and why did PC gaming become so incredibly popular (again)?',
        upvotes: '0',
        comments: '78',
    },
];

export const SearchScreen = () => {
    // The user’s current search text
    const [searchQuery, setSearchQuery] = useState('');

    /**
     * Filter the mock results based on the user’s search query
     * (matching either the title or the subreddit name).
     */
    const filteredResults = useMemo(() => {
        const lowerQuery = searchQuery.toLowerCase();
        return MOCK_RESULTS.filter(
            (item) =>
                item.title.toLowerCase().includes(lowerQuery) ||
                item.subreddit.toLowerCase().includes(lowerQuery)
        );
    }, [searchQuery]);

    return (
        <View style={styles.container}>
            {/* Shared search box component at the top */}
            <SearchBox value={searchQuery} onChangeText={setSearchQuery} />

            {/* Filter row mimicking Relevance / All time / Safe Search Off */}
            <View style={styles.filterRow}>
                <TouchableOpacity style={styles.filterButton}>
                    <Text style={styles.filterButtonText}>Relevance</Text>
                    <FontAwesome
                        name="caret-down"
                        size={14}
                        color={COLORS.InactiveText}
                        style={styles.filterIcon}
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterButton}>
                    <Text style={styles.filterButtonText}>All time</Text>
                    <FontAwesome
                        name="caret-down"
                        size={14}
                        color={COLORS.InactiveText}
                        style={styles.filterIcon}
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterButton}>
                    <Text style={styles.filterButtonText}>Safe Search Off</Text>
                    <FontAwesome
                        name="caret-down"
                        size={14}
                        color={COLORS.InactiveText}
                        style={styles.filterIcon}
                    />
                </TouchableOpacity>
            </View>

            {/* Scrollable list of filtered search results */}
            <ScrollView style={styles.resultsContainer}>
                {filteredResults.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.resultItem}
                        onPress={() => {
                            // Example: Navigate to a details screen or do something
                            console.log('Tapped:', item.title);
                        }}
                    >
                        <View style={styles.resultHeader}>
                            <Text style={styles.subredditText}>
                                {item.subreddit}
                            </Text>
                            <Text style={styles.timeText}>{item.time}</Text>
                        </View>
                        <Text style={styles.titleText}>{item.title}</Text>
                        <Text style={styles.metaText}>
                            {item.upvotes} upvotes • {item.comments} comments
                        </Text>
                    </TouchableOpacity>
                ))}

                {/* Fallback message if there are no matching results */}
                {filteredResults.length === 0 && (
                    <View style={{ marginTop: 20 }}>
                        <Text style={{ color: 'white' }}>
                            No results found for "{searchQuery}".
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.AppBackground,
        paddingTop: Platform.OS === 'ios' ? 0 : 0,
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.TextInput,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchBar: {
        flex: 1,
        color: COLORS.White,
        fontFamily: 'Roboto_400Regular',
        fontSize: 16,
        padding: 0,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.TextInput,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    filterButtonText: {
        color: COLORS.InactiveText,
        fontFamily: 'Roboto_400Regular',
        marginRight: 4,
        fontSize: 13,
    },
    filterIcon: {
        marginTop: 1,
    },
    resultsContainer: {
        flex: 1,
        paddingHorizontal: 10,
    },
    resultItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.TextInput,
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    subredditText: {
        color: COLORS.AccentText,
        fontFamily: 'Roboto_700Bold',
        fontSize: 14,
        marginRight: 8,
    },
    timeText: {
        color: COLORS.InactiveText,
        fontFamily: 'Roboto_400Regular',
        fontSize: 12,
    },
    titleText: {
        color: COLORS.White,
        fontFamily: 'Roboto_400Regular',
        fontSize: 15,
        marginBottom: 2,
    },
    metaText: {
        color: COLORS.InactiveText,
        fontFamily: 'Roboto_400Regular',
        fontSize: 12,
    },
});
