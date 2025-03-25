import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '../constants';
import { MarkdownInputBase, MarkdownInputBaseProps } from './MarkdownInputBase';

export interface MarkdownTextInputProps extends MarkdownInputBaseProps {}

const isWeb = Platform.OS === 'web';

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
        multiline={false}
    />
);

const styles = StyleSheet.create({
    inputWrapper: {
        height: 40,
        position: 'relative',
        backgroundColor: COLORS.TextInput,
        flex: 1,
        borderRadius: 20,
    },
    inputTextOverlay: {
        position: 'absolute',
        top: isWeb ? 5 : -5,
        left: 0,
        right: 0,
        height: 40,
        fontSize: 14,
        color: 'white',
        textAlignVertical: 'center',
        lineHeight: 20,
        zIndex: 1,
        borderRadius: 20,
    },
    input: {
        height: 40,
        backgroundColor: 'transparent',
        borderRadius: 20,
        fontSize: 14,
        textAlignVertical: 'center',
        color: 'transparent',
        fontFamily: 'Roboto_400Regular',
        // @ts-expect-error web only type
        caretColor: 'white',
        zIndex: 2,
    },
});
