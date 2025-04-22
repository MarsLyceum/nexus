import React, { useMemo } from 'react';
import { StyleSheet, Platform } from 'react-native';

import { useTheme, Theme } from '../theme';

import { MarkdownInputBase, MarkdownInputBaseProps } from './MarkdownInputBase';

export interface MarkdownTextInputProps extends MarkdownInputBaseProps {}

const isWeb = Platform.OS === 'web';

export const MarkdownTextInput: React.FC<MarkdownTextInputProps> = ({
    value,
    onChangeText,
    placeholder,
    style,
    ...rest
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
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
};

function createStyles(theme: Theme) {
    return StyleSheet.create({
        inputWrapper: {
            height: 40,
            position: 'relative',
            backgroundColor: theme.colors.TextInput,
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
            color: theme.colors.ActiveText,
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
            caretColor: 'white',
            zIndex: 2,
        },
    });
}
