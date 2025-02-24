import React from 'react';
import { StyleSheet } from 'react-native';
import { COLORS } from '../constants';
import { MarkdownInputBase, MarkdownInputBaseProps } from './MarkdownInputBase';

export interface MarkdownTextInputProps extends MarkdownInputBaseProps {}

export const MarkdownTextInput: React.FC<MarkdownTextInputProps> = ({
    value,
    onChangeText,
    placeholder,
    style,
    ...rest
}) => (
    <MarkdownInputBase
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        {...rest}
        // Apply single-line styles
        wrapperStyle={styles.inputWrapper}
        overlayStyle={styles.inputTextOverlay}
        inputStyle={[styles.input, style]}
        // Single-line input (default multiline is false)
    />
);

const styles = StyleSheet.create({
    inputWrapper: {
        height: 40,
        position: 'relative',
        backgroundColor: COLORS.TextInput, // NEW: Moved background color to the wrapper
        flex: 1,
        borderRadius: 20, // Ensures the background respects the rounded corners
    },
    inputTextOverlay: {
        position: 'absolute', // Ensure overlay is positioned absolutely
        top: 0,
        left: 0,
        right: 0,
        height: 40,
        fontSize: 14,
        color: 'white',
        textAlignVertical: 'center',
        lineHeight: 40,
        zIndex: 2,
    },
    input: {
        height: 40,
        backgroundColor: 'transparent', // Keep transparent so wrapper's background shows
        // paddingHorizontal: 10,
        borderRadius: 20,
        fontSize: 14,
        textAlignVertical: 'center',
        // color: 'transparent',
        color: 'black',
        fontFamily: 'Roboto_400Regular',
        caretColor: 'white',
        zIndex: 1,
    },
});
