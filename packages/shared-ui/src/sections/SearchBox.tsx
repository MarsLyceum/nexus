// SearchBox.tsx
import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { COLORS } from '../constants';
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
}) => (
    <View style={[styles.container, desktop && styles.desktopContainer]}>
        <Search style={styles.icon} />
        <TextInput
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

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.TextInput,
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
        color: COLORS.White,
        fontSize: 16,
        fontFamily: 'Roboto_400Regular',
        padding: 0,
        // Remove the outline on web browsers:
        // @ts-expect-error we get an error because this only exists for web
        outlineStyle: 'none',
    },
});
