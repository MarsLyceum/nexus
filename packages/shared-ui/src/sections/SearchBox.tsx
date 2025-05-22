// SearchBox.tsx
import React, { useMemo } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

import { useTheme, Theme } from '../theme';
import { Search } from '../icons';

interface SearchBoxProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    desktop?: boolean;
    onSubmitEditing?: () => void;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
    value,
    onChangeText,
    placeholder = 'Search...',
    desktop = false,
    onSubmitEditing,
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <View style={[styles.container, desktop && styles.desktopContainer]}>
            <Search style={styles.icon} />
            <TextInput
                // @ts-expect-error outline
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#999"
                value={value}
                onChangeText={onChangeText}
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={onSubmitEditing}
            />
        </View>
    );
};

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.TextInput,
            paddingHorizontal: 10,
            paddingVertical: 8,
            borderRadius: 6,
        },
        // Additional style for a wider search box in desktop mode
        desktopContainer: {
            width: 500, // Adjust this value as needed for your desktop layout
        },
        icon: {
            marginRight: 8,
        },
        input: {
            flex: 1,
            color: theme.colors.ActiveText,
            fontSize: 16,
            fontFamily: 'Roboto_400Regular',
            padding: 0,
            // Remove the outline on web browsers:
            outlineStyle: 'none',
        },
    });
}
