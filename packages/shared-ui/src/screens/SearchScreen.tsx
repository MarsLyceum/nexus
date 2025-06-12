import React, { useContext, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';

import { useTheme, Theme } from '../theme';
import { BackArrow } from '../buttons';
import { SearchBox, PostItem } from '../sections';
import { useSearchFilter, useNexusRouter } from '../hooks';
import { SearchContext } from '../providers';
import { ChevronDown } from '../icons';
import { FeedPost } from '../types';

const MOCK_RESULTS: FeedPost[] = [
    {
        id: '1',
        group: 'r/gaming',
        username: 'gamer1',
        time: '1y',
        title: "I think it's time to slowly step away from PC gaming",
        upvotes: 0,
        commentsCount: 275,
        domain: '',
        shareCount: 0,
        content: '',
        thumbnail: `https://picsum.photos/seed/gamer1/48`,
    },
    {
        id: '2',
        group: 'r/SubredditDrama',
        username: 'dramaKing',
        time: '5y',
        title: '/r/pcgaming reacts to the /r/Games shutdown',
        upvotes: 76_000,
        commentsCount: 3000,
        domain: '',
        shareCount: 0,
        content: '',
        thumbnail: `https://picsum.photos/seed/dramaKing/48`,
    },
    {
        id: '3',
        group: 'r/pcmasterrace',
        username: 'elitegamer',
        time: '1y',
        title: 'Is pc gaming no longer affordable?',
        upvotes: 2000,
        commentsCount: 1600,
        domain: '',
        shareCount: 0,
        content: '',
        thumbnail: `https://picsum.photos/seed/elitegamer/48`,
    },
    {
        id: '4',
        group: 'r/pcgaming',
        username: 'pcfanatic',
        time: '7d',
        title: 'Hot take: PC gaming kinda sucks right now',
        upvotes: 0,
        commentsCount: 59,
        domain: '',
        shareCount: 0,
        content: '',
        thumbnail: `https://picsum.photos/seed/pcfanatic/48`,
    },
    {
        id: '5',
        group: 'r/pcgaming',
        username: 'techguru',
        time: '1y',
        title: 'When and why did PC gaming become so incredibly popular (again)?',
        upvotes: 0,
        commentsCount: 78,
        domain: '',
        shareCount: 0,
        content: '',
        thumbnail: `https://picsum.photos/seed/techguru/48`,
    },
];

export const SearchScreen = () => {
    const { searchText, setSearchText } = useContext(SearchContext);
    const router = useNexusRouter();
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const filteredResults = useSearchFilter<FeedPost>(
        MOCK_RESULTS,
        searchText,
        ['title', 'group', 'username']
    );

    return (
        <View style={styles.container}>
            {/* Header row with back arrow and filter buttons */}
            <View style={styles.headerRow}>
                <BackArrow
                    onPress={() => {
                        // In production, consider wrapping router.back() with error handling/logging
                        router.goBack();
                    }}
                />
                <View style={styles.filterRow}>
                    <TouchableOpacity style={styles.filterButton}>
                        <Text style={styles.filterButtonText}>Relevance</Text>
                        <ChevronDown style={styles.filterIcon} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.filterButton}>
                        <Text style={styles.filterButtonText}>All time</Text>
                        <ChevronDown style={styles.filterIcon} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.filterButton}>
                        <Text style={styles.filterButtonText}>
                            Safe Search Off
                        </Text>
                        <ChevronDown style={styles.filterIcon} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* SearchBox below the header row */}
            <View style={styles.searchBoxContainer}>
                <SearchBox value={searchText} onChangeText={setSearchText} />
            </View>

            <ScrollView style={styles.resultsContainer}>
                {filteredResults.map((item) => (
                    <PostItem
                        key={item.id}
                        post={item}
                        preview
                        variant="default" // Use default variant: shows group & username with group avatar.
                        onPress={() => {
                            // Consider logging user interaction in production
                            console.log('Tapped:', item.title);
                        }}
                    />
                ))}

                {filteredResults.length === 0 && (
                    <View style={{ marginTop: 20 }}>
                        <Text style={{ color: theme.colors.ActiveText }}>
                            No results found for "{searchText}".
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.SecondaryBackground,
        },
        headerRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.TextInput,
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
            color: theme.colors.InactiveText,
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
}
