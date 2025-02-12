// SearchScreen.tsx
import React, { useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    useWindowDimensions,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import { BackArrow } from '../buttons';
import { COLORS } from '../constants';
import { SearchBox, PostItem } from '../sections';
import { useSearchFilter } from '../hooks';
import { SearchContext } from '../providers';

type SearchResult = {
    id: string;
    group: string;
    username: string;
    time: string;
    title: string;
    upvotes: string;
    comments: string;
};

const MOCK_RESULTS: SearchResult[] = [
    {
        id: '1',
        group: 'r/gaming',
        username: 'gamer1',
        time: '1y',
        title: "I think it's time to slowly step away from PC gaming",
        upvotes: '0',
        comments: '275',
    },
    {
        id: '2',
        group: 'r/SubredditDrama',
        username: 'dramaKing',
        time: '5y',
        title: '/r/pcgaming reacts to the /r/Games shutdown',
        upvotes: '7.6k',
        comments: '3.0k',
    },
    {
        id: '3',
        group: 'r/pcmasterrace',
        username: 'elitegamer',
        time: '1y',
        title: 'Is pc gaming no longer affordable?',
        upvotes: '2.0k',
        comments: '1.6k',
    },
    {
        id: '4',
        group: 'r/pcgaming',
        username: 'pcfanatic',
        time: '7d',
        title: 'Hot take: PC gaming kinda sucks right now',
        upvotes: '0',
        comments: '59',
    },
    {
        id: '5',
        group: 'r/pcgaming',
        username: 'techguru',
        time: '1y',
        title: 'When and why did PC gaming become so incredibly popular (again)?',
        upvotes: '0',
        comments: '78',
    },
];

// Helper: Convert string counts (e.g., "7.6k") to numbers.
const parseCount = (count: string): number => {
    if (count.toLowerCase().endsWith('k')) {
        return Math.round(parseFloat(count) * 1000);
    }
    return parseInt(count, 10);
};

export const SearchScreen = () => {
    const { searchText, setSearchText } = useContext(SearchContext);
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;
    const navigation = useNavigation();

    const filteredResults = useSearchFilter<SearchResult>(
        MOCK_RESULTS,
        searchText,
        ['title', 'group', 'username']
    );

    return (
        <View style={styles.container}>
            {/* Header row with back arrow and filter buttons */}
            <View style={styles.headerRow}>
                <BackArrow onPress={() => navigation.goBack()} />
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
                        <Text style={styles.filterButtonText}>
                            Safe Search Off
                        </Text>
                        <FontAwesome
                            name="caret-down"
                            size={14}
                            color={COLORS.InactiveText}
                            style={styles.filterIcon}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* SearchBox below the header row */}
            {!isDesktop && (
                <View style={styles.searchBoxContainer}>
                    <SearchBox
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                </View>
            )}

            <ScrollView style={styles.resultsContainer}>
                {filteredResults.map((item) => (
                    <PostItem
                        id={item.id}
                        key={item.id}
                        username={item.username}
                        group={item.group}
                        time={item.time}
                        title={item.title}
                        content="" // No additional content for search results.
                        upvotes={parseCount(item.upvotes)}
                        commentsCount={parseCount(item.comments)}
                        preview
                        variant="default" // Use default variant: shows group & username with group avatar.
                        onPress={() => console.log('Tapped:', item.title)}
                    />
                ))}

                {filteredResults.length === 0 && (
                    <View style={{ marginTop: 20 }}>
                        <Text style={{ color: COLORS.White }}>
                            No results found for "{searchText}".
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
        backgroundColor: COLORS.SecondaryBackground,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.TextInput,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
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
    searchBoxContainer: {
        padding: 10,
    },
    resultsContainer: {
        flex: 1,
        paddingHorizontal: 10,
    },
});
