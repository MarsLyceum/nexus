// MarkdownTextInput.tsx
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
    },
    inputTextOverlay: {
        top: 0,
        left: 10,
        right: 0,
        height: 40,
        fontSize: 14,
        color: 'white',
        textAlignVertical: 'center',
        lineHeight: 40,
        fontFamily: 'Roboto_400Regular',
    },
    input: {
        height: 40,
        backgroundColor: COLORS.TextInput,
        paddingHorizontal: 10,
        borderRadius: 20,
        fontSize: 14,
        textAlignVertical: 'center',
        color: 'white',
        fontFamily: 'Roboto_400Regular',
    },
});
