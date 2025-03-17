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
    width = '100%',
    height = '250px',
    ...rest
}) => {
    // State to track focus.
    const [isFocused, setIsFocused] = React.useState(false);

    const containerStyle: object = {
        ...(width ? { width } : {}),
        ...(height ? { height } : {}),
    };

    return (
        <View style={[styles.container, containerStyle]}>
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
        backgroundColor: 'transparent', // UPDATED: Transparent to show overlay beneath
        fontFamily: 'Roboto_400Regular',
        textAlignVertical: 'top',
        zIndex: 2,
    },
});
