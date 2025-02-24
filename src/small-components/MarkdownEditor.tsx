import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../constants';
import { MarkdownInputBase, MarkdownInputBaseProps } from './MarkdownInputBase';

export interface MarkdownEditorProps extends MarkdownInputBaseProps {}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
    value,
    onChangeText,
    placeholder,
    style,
    ...rest
}) => {
    // State to track focus.
    const [isFocused, setIsFocused] = React.useState(false);

    return (
        <View style={styles.container}>
            <MarkdownInputBase
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                {...rest}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
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
        width: '100%',
        height: 250, // Numeric height for mobile compatibility
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
        paddingHorizontal: 10,
        paddingVertical: 5,
        fontSize: 14,
        color: 'white',
        lineHeight: 20,
        fontFamily: 'Roboto_400Regular',
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: 'rgba(255,255,255,0.01)', // nearly invisible text
        caretColor: 'white',
        lineHeight: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        backgroundColor: 'transparent', // UPDATED: Transparent to show overlay beneath
        fontFamily: 'Roboto_400Regular',
        textAlignVertical: 'top',
    },
});
