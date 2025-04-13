// src/theme/ThemeScreen.tsx
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Platform,
} from 'react-native';
import { useTheme, themesByCategory, Theme } from '../theme';

// --- Helper: Get screen width for responsive layout ---
const screenWidth = Dimensions.get('window').width;
const numColumns = screenWidth > 600 ? 6 : 4;
const itemMargin = 6;
const itemPadding = 12;
const itemWidth =
    (screenWidth - itemPadding * 2 - itemMargin * numColumns) / numColumns;
// --- Adjusted Preview Height Calculation ---
// Make height mostly dependent on width + a small fixed amount for the label/padding
const previewHeight = 100; // Even less extra height

// --- ThemePreview Component Definition ---
interface ThemePreviewProps {
    themeData: Theme;
    isActive: boolean;
    onPress: () => void;
}

const ThemePreview: React.FC<ThemePreviewProps> = ({
    themeData,
    isActive,
    onPress,
}) => {
    const { theme: activeTheme } = useTheme();

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.previewContainer,
                {
                    width: itemWidth,
                    height: previewHeight,
                    backgroundColor: themeData.colors.PrimaryBackground, // Background still represents the theme bg
                    borderColor: isActive
                        ? activeTheme.colors.Primary
                        : 'rgba(128, 128, 128, 0.2)',
                    borderWidth: isActive ? 1.5 : 0.5,
                },
            ]}
            accessibilityLabel={`Select theme: ${themeData.name}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
        >
            {/* Visual color swatches - VERY THIN */}
            <View style={styles.swatchContainer}>
                <View
                    style={[
                        styles.swatch,
                        { backgroundColor: themeData.colors.Primary },
                    ]}
                />
                <View
                    style={[
                        styles.swatch,
                        { backgroundColor: themeData.colors.MainText },
                    ]}
                />
                {/* Add maybe one more very thin swatch if absolutely needed */}
                {/* <View style={[styles.swatch, { backgroundColor: themeData.colors.Secondary }]} /> */}
            </View>

            {/* Theme Name Label */}
            <Text
                style={[
                    styles.previewLabel,
                    { color: themeData.colors.MainText },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
            >
                {themeData.name}
            </Text>

            {/* Active Indicator */}
            {isActive && (
                <View
                    style={[
                        styles.activeIndicator,
                        {
                            backgroundColor:
                                activeTheme.colors.PrimaryBackground,
                        },
                    ]}
                >
                    <Text
                        style={[
                            styles.checkmark,
                            { color: activeTheme.colors.Primary },
                        ]}
                    >
                        ✓
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

// --- Main ThemeScreen Component ---
export const ThemeScreen: React.FC = () => {
    const { theme, setThemeByName } = useTheme();

    return (
        <ScrollView
            style={[
                styles.container,
                { backgroundColor: theme.colors.PrimaryBackground },
            ]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            <Text style={[styles.title, { color: theme.colors.Primary }]}>
                Select Theme
            </Text>

            {Object.entries(themesByCategory).map(([category, themes]) => (
                <View key={category} style={styles.section}>
                    <Text
                        style={[
                            styles.sectionTitle,
                            { color: theme.colors.MainText },
                        ]}
                    >
                        {category}
                    </Text>
                    <View style={styles.themeGrid}>
                        {themes.map((t) => (
                            <ThemePreview
                                key={t.name}
                                themeData={t}
                                isActive={t.name === theme.name}
                                onPress={() => setThemeByName(t.name)}
                            />
                        ))}
                    </View>
                </View>
            ))}
        </ScrollView>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: itemPadding,
        paddingBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: itemMargin / 2,
    },
    themeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    // Styles for ThemePreview Component
    previewContainer: {
        borderRadius: 6,
        overflow: 'hidden', // Important to clip the swatch container if it has border radius
        paddingTop: 4, // Reduced top/bottom padding
        paddingBottom: 4,
        paddingHorizontal: 5, // Keep horizontal padding same
        alignItems: 'center',
        justifyContent: 'space-between', // Pushes label towards bottom
        marginBottom: itemMargin,
        marginRight: itemMargin,
        position: 'relative', // Needed for absolute positioning of indicator
    },
    // --- Updated Swatch Styles ---
    swatchContainer: {
        flexDirection: 'row',
        height: 6, // <<<<<----- DRASTICALLY REDUCED HEIGHT HERE
        width: '100%', // Take full width inside padding
        // marginBottom: 4, // Reduce space below swatches
        borderRadius: 2, // Optional: tiny radius for swatch container itself
        overflow: 'hidden', // Clip the individual swatches
        // Removed marginBottom to bring label closer
    },
    swatch: {
        // Single style for all swatches now
        flex: 1, // Make swatches equal width for simplicity
    },
    // swatchPrimary: { // Removed specific swatch styles, using generic 'swatch'
    //     flex: 1,
    // },
    // swatchText: { // Removed specific swatch styles, using generic 'swatch'
    //     flex: 1,
    // },
    previewLabel: {
        fontSize: 10,
        fontWeight: '500',
        textAlign: 'center',
        width: '100%',
        marginTop: 4, // Add small margin top now that swatch margin bottom is removed
    },
    activeIndicator: {
        position: 'absolute',
        top: 2, // Adjust position slightly due to reduced padding
        right: 2, // Adjust position slightly
        borderRadius: 8,
        width: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 0.5,
        borderColor: 'rgba(128, 128, 128, 0.4)',
    },
    checkmark: {
        fontSize: 9,
        fontWeight: 'bold',
        lineHeight: 14, // Adjust line height for vertical centering in indicator
    },
});
