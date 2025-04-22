// src/theme/ThemeScreen.tsx
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
// Assuming useTheme and themesByCategory are correctly imported from your theme setup
import { useTheme, themesByCategory, Theme } from '../theme'; // Adjust path if necessary
import { useScreenWidth } from '../hooks';

// --- ThemePreview Component Definition ---
interface ThemePreviewProps {
    themeData: Theme;
    isActive: boolean;
    onPress: () => void;
    width: number;
    height: number;
    margin: number;
}

// eslint-disable-next-line react/display-name
const ThemePreview: React.FC<ThemePreviewProps> = React.memo(
    ({ themeData, isActive, onPress, width, height, margin }) => {
        // Get the currently active theme context to style the *active* indicator/border correctly
        const { theme: activeThemeContext } = useTheme();

        return (
            <TouchableOpacity
                onPress={onPress}
                style={[
                    styles.previewContainer,
                    {
                        width,
                        height,
                        backgroundColor: themeData.colors.PrimaryBackground, // Use the theme's background
                        // --- Improved Active State Styling ---
                        borderColor: isActive
                            ? activeThemeContext.colors.Primary // Use active theme's primary color for border
                            : 'rgba(128, 128, 128, 0.3)', // Softer border for inactive
                        borderWidth: isActive ? 2 : 1, // Thicker border when active
                        marginRight: margin, // Apply margin consistently
                        marginBottom: margin,
                    },
                ]}
                accessibilityLabel={`Select theme: ${themeData.name}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
            >
                {/* --- More Informative Swatches --- */}
                <View style={styles.swatchContainer}>
                    <View
                        style={[
                            styles.swatch,
                            { backgroundColor: themeData.colors.Primary },
                        ]}
                    />
                    {/* Added Secondary color swatch */}
                    <View
                        style={[
                            styles.swatch,
                            { backgroundColor: themeData.colors.Secondary }, // Assuming Secondary exists
                        ]}
                    />
                    <View
                        style={[
                            styles.swatch,
                            { backgroundColor: themeData.colors.MainText },
                        ]}
                    />
                </View>

                {/* --- Slightly Larger Theme Name Label --- */}
                <Text
                    style={[
                        styles.previewLabel,
                        { color: themeData.colors.MainText }, // Label color from its own theme
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {themeData.name}
                </Text>

                {/* --- Clearer Active Indicator --- */}
                {isActive && (
                    <View
                        style={[
                            styles.activeIndicator,
                            {
                                // Use active theme's background for contrast, primary for border
                                backgroundColor:
                                    activeThemeContext.colors.PrimaryBackground,
                                borderColor: activeThemeContext.colors.Primary,
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.checkmark,
                                // Use active theme's primary color for the checkmark itself
                                { color: activeThemeContext.colors.Primary },
                            ]}
                        >
                            ✓
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    }
); // Use React.memo for performance optimization if themeData doesn't change unnecessarily

// --- Main ThemeScreen Component ---
export const ThemeScreen: React.FC = () => {
    const { theme, setThemeByName } = useTheme();
    const screenWidth = useScreenWidth(1920);

    // --- Helper: Get screen width for responsive layout ---
    // const screenWidth = Dimensions.get('window').width;
    // Adjust columns based on screen width (example thresholds)
    const numColumns = screenWidth > 1000 ? 6 : screenWidth > 600 ? 5 : 4;
    const itemPaddingHorizontal = 16; // Overall padding for the scroll view
    const itemMargin = 8; // Margin between items

    // --- Adjusted Item Width Calculation ---
    const totalHorizontalMargin = itemMargin * (numColumns - 1);
    const availableWidth =
        screenWidth - itemPaddingHorizontal * 2 - totalHorizontalMargin;
    const itemWidth = availableWidth / numColumns;

    // --- Adjusted Preview Height Calculation ---
    // Make height proportional to width for a better aspect ratio, plus space for label
    const previewHeight = itemWidth * 0.6 + 35; // Aspect ratio + fixed height for label/padding

    return (
        <ScrollView
            style={[
                styles.container,
                { backgroundColor: theme.colors.PrimaryBackground }, // Use active theme background
            ]}
            contentContainerStyle={[
                styles.scrollContent,
                // Adjust padding based on calculated horizontal padding
                { paddingHorizontal: itemPaddingHorizontal },
            ]}
            showsVerticalScrollIndicator={false}
        >
            {/* Screen Title */}
            <Text style={[styles.title, { color: theme.colors.Primary }]}>
                Select Theme
            </Text>

            {/* Map through categories and themes */}
            {Object.entries(themesByCategory).map(([category, themes]) => (
                <View key={category} style={styles.section}>
                    {/* Category Title */}
                    <Text
                        style={[
                            styles.sectionTitle,
                            { color: theme.colors.MainText },
                        ]}
                    >
                        {category}
                    </Text>
                    {/* Grid for themes within the category */}
                    <View style={styles.themeGrid}>
                        {themes.map((t) => (
                            <ThemePreview
                                key={t.name}
                                themeData={t}
                                isActive={t.name === theme.name} // Check if this theme 't' is the active one
                                onPress={() => setThemeByName(t.name)}
                                width={itemWidth}
                                height={previewHeight}
                                margin={itemMargin}
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
        paddingTop: 20, // Add some top padding
        paddingBottom: 30, // Ensure space at the bottom
        // horizontal padding is set dynamically based on itemPaddingHorizontal
    },
    title: {
        fontSize: 22, // Slightly larger title
        fontWeight: 'bold',
        marginBottom: 24, // More space below title
        textAlign: 'center',
    },
    section: {
        marginBottom: 24, // More space between sections
    },
    sectionTitle: {
        fontSize: 18, // Larger category titles
        fontWeight: '600',
        marginBottom: 12, // More space below category title
        // Removed marginLeft, grid alignment handles spacing
    },
    themeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        // No margin/padding here, handled by item margin and scrollview padding
    },
    // --- Styles for ThemePreview Component ---
    previewContainer: {
        borderRadius: 8, // Slightly more rounded corners
        overflow: 'hidden',
        padding: 6, // Internal padding around content
        alignItems: 'center',
        justifyContent: 'space-between', // Pushes label towards bottom
        position: 'relative',
        // Width, Height, MarginRight, MarginBottom applied dynamically inline
    },
    // --- Updated Swatch Styles ---
    swatchContainer: {
        flexDirection: 'row',
        height: 12, // <<<----- Increased swatch height slightly
        width: '100%',
        borderRadius: 4, // Rounded corners for the swatch group
        overflow: 'hidden',
        marginBottom: 8, // Space between swatches and label
    },
    swatch: {
        flex: 1, // Divide space equally
    },
    // --- Updated Label Styles ---
    previewLabel: {
        fontSize: 12, // <<<----- Increased label font size
        fontWeight: '500',
        textAlign: 'center',
        width: '100%', // Ensure it takes full width for centering
    },
    // --- Updated Active Indicator Styles ---
    activeIndicator: {
        position: 'absolute',
        top: 4, // Position near top-right corner
        right: 4,
        borderRadius: 10, // Make it circular
        width: 20, // <<<----- Slightly larger indicator
        height: 20, // <<<----- Slightly larger indicator
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1, // Give indicator a border
        // Background and BorderColor applied dynamically inline
    },
    checkmark: {
        fontSize: 11, // <<<----- Slightly larger checkmark
        fontWeight: 'bold',
        lineHeight: 18, // Adjust line height for vertical centering
        // Color applied dynamically inline
    },
});
