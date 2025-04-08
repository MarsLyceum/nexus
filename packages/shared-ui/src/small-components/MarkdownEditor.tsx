// MarkdownEditor.tsx
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../constants';
import { MarkdownInputBase, MarkdownInputBaseProps } from './MarkdownInputBase';

export interface MarkdownEditorProps extends MarkdownInputBaseProps {}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
    value,
    onChangeText,
    placeholder,
    style,
    width = '100%',
    height = '250px',
    onFocus, // Destructure onFocus from props
    onBlur, // Destructure onBlur from props
    ...rest
}) => {
    // State to track focus.
    const [isFocused, setIsFocused] = React.useState(false);

    // Convert height to a number if it is a string ending with "px" on non-web platforms.
    let parsedHeight: string | number = height;
    if (
        typeof height === 'string' &&
        height.endsWith('px') &&
        Platform.OS !== 'web'
    ) {
        parsedHeight = Number.parseInt(height, 10);
    }

    // Convert width to a number if it is a string ending with "px" on non-web platforms.
    let parsedWidth: string | number = width;
    if (
        typeof width === 'string' &&
        width.endsWith('px') &&
        Platform.OS !== 'web'
    ) {
        parsedWidth = Number.parseInt(width, 10);
    }

    const containerStyle: object = {
        ...(parsedWidth ? { width: parsedWidth } : {}),
        ...(parsedHeight ? { height: parsedHeight } : {}),
    };

    // Internal focus handler that also calls parent's onFocus if provided.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleFocus = (e: any) => {
        setIsFocused(true);
        if (onFocus) {
            onFocus(e);
        }
    };

    // Internal blur handler that also calls parent's onBlur if provided.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleBlur = (e: any) => {
        setIsFocused(false);
        if (onBlur) {
            onBlur(e);
        }
    };

    return (
        <View style={[styles.container, containerStyle]}>
            <MarkdownInputBase
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                {...rest}
                onFocus={handleFocus}
                onBlur={handleBlur}
                wrapperStyle={[
                    styles.inputWrapper,
                    isFocused && styles.activeInputWrapper,
                ]}
                overlayStyle={styles.inputTextOverlay}
                inputStyle={[styles.input, style]}
                multiline
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
    },
    inputWrapper: {
        flex: 1,
        position: 'relative',
        backgroundColor: COLORS.PrimaryBackground,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 0,
        borderColor: 'transparent',
    },
    activeInputWrapper: {
        borderWidth: 1,
        borderColor: COLORS.White,
    },
    inputTextOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        fontSize: 14,
        color: 'white',
        lineHeight: 20,
        fontFamily: 'Roboto_400Regular',
        zIndex: 1,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: 'transparent', // nearly invisible text
        // @ts-expect-error web only type
        caretColor: 'white',
        paddingTop: 10,
        lineHeight: 20,
        borderRadius: 20,
        backgroundColor: 'transparent', // Transparent to show overlay beneath
        fontFamily: 'Roboto_400Regular',
        textAlignVertical: 'top',
        zIndex: 2,
    },
});
