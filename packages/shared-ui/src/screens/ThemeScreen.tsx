// src/theme/ThemeSwitcher.tsx
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { themesByCategory } from '../theme';
import { useTheme } from '../providers';

export const ThemeScreen: React.FC = () => {
    const { theme, setThemeByName } = useTheme();

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: theme.colors.PrimaryBackground },
            ]}
        >
            <Text style={[styles.title, { color: theme.colors.Primary }]}>
                Current Theme: {theme.name}
            </Text>
            <ScrollView contentContainerStyle={styles.scrollContent}>
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
                        <View style={styles.themeList}>
                            {themes.map((t) => {
                                const isActive = t.name === theme.name;
                                return (
                                    <TouchableOpacity
                                        key={t.name}
                                        onPress={() => setThemeByName(t.name)}
                                        style={[
                                            styles.themeButton,
                                            {
                                                backgroundColor:
                                                    t.colors.PrimaryBackground,
                                                borderColor: isActive
                                                    ? theme.colors.Primary
                                                    : theme.colors.Tertiary,
                                                borderWidth: isActive ? 2 : 1,
                                            },
                                        ]}
                                    />
                                );
                            })}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 20,
        marginBottom: 16,
    },
    scrollContent: {
        paddingBottom: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        marginBottom: 8,
    },
    themeList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    themeButton: {
        width: 40,
        height: 40,
        borderRadius: 4,
        margin: 4,
    },
});
