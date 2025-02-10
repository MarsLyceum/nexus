// SearchBox.tsx
import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { COLORS } from '../constants';

interface SearchBoxProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    desktop?: boolean;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
    value,
    onChangeText,
    placeholder = 'Search...',
    desktop = false,
}) => (
    <View style={[styles.container, desktop && styles.desktopContainer]}>
        <FontAwesome name="search" size={18} color="#999" style={styles.icon} />
        <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#999"
            value={value}
            onChangeText={onChangeText}
            autoCapitalize="none"
            autoCorrect={false}
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
    },
});
