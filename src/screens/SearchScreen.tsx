import React, { useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    useWindowDimensions,
    Image,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { COLORS } from '../constants';
import { SearchBox } from '../sections';
import { useSearchFilter } from '../hooks';
import { SearchContext } from '../providers';

type SearchResult = {
    id: number;
    group: string;
    time: string;
    title: string;
    upvotes: string;
    comments: string;
};

const MOCK_RESULTS: SearchResult[] = [
    {
        id: 1,
        group: 'r/gaming',
        time: '1y',
        title: "I think it's time to slowly step away from PC gaming",
        upvotes: '0',
        comments: '275',
    },
    {
        id: 2,
        group: 'r/SubredditDrama',
        time: '5y',
        title: '/r/pcgaming reacts to the /r/Games shutdown',
        upvotes: '7.6k',
        comments: '3.0k',
    },
    {
        id: 3,
        group: 'r/pcmasterrace',
        time: '1y',
        title: 'Is pc gaming no longer affordable?',
        upvotes: '2.0k',
        comments: '1.6k',
    },
    {
        id: 4,
        group: 'r/pcgaming',
        time: '7d',
        title: 'Hot take: PC gaming kinda sucks right now',
        upvotes: '0',
        comments: '59',
    },
    {
        id: 5,
        group: 'r/pcgaming',
        time: '1y',
        title: 'When and why did PC gaming become so incredibly popular (again)?',
        upvotes: '0',
        comments: '78',
    },
];

// Remove any "/" from the group string before encoding the seed.
const getAvatarUri = (group: string) =>
    `https://picsum.photos/seed/${encodeURIComponent(group.replace(/\//g, ''))}/48/48`;

export const SearchScreen = () => {
    const { searchText, setSearchText } = useContext(SearchContext);
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;

    const filteredResults = useSearchFilter<SearchResult>(
        MOCK_RESULTS,
        searchText,
        ['title', 'group']
    );

    return (
        <View style={styles.container}>
            {!isDesktop && (
                <SearchBox value={searchText} onChangeText={setSearchText} />
            )}

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

            <ScrollView style={styles.resultsContainer}>
                {filteredResults.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.resultItem}
                        onPress={() => console.log('Tapped:', item.title)}
                    >
                        <View style={styles.resultHeader}>
                            <Image
                                source={{ uri: getAvatarUri(item.group) }}
                                style={styles.avatarPlaceholder}
                            />
                            <Text style={styles.groupText}>{item.group}</Text>
                            <Text style={styles.timeText}>{item.time}</Text>
                        </View>
                        <Text style={styles.titleText}>{item.title}</Text>
                        <Text style={styles.metaText}>
                            {item.upvotes} upvotes • {item.comments} comments
                        </Text>
                    </TouchableOpacity>
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
        paddingTop: Platform.OS === 'ios' ? 0 : 0,
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
        backgroundColor: COLORS.PrimaryBackground,
        borderRadius: 8,
        padding: 15,
        marginVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    avatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
    },
    groupText: {
        color: COLORS.InactiveText,
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
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    metaText: {
        color: COLORS.InactiveText,
        fontFamily: 'Roboto_400Regular',
        fontSize: 12,
    },
});
