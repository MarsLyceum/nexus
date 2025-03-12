import React, { useRef } from 'react';
import {
    ScrollView,
    View,
    TextInput,
    TextInputProps,
    StyleSheet,
    NativeSyntheticEvent,
    TextInputScrollEventData,
    Platform,
} from 'react-native';
import { MarkdownOverlay } from './MarkdownOverlay';
import { COLORS } from '../constants';
// <-- New import for emoji picker integration
import { EmojiPicker, EmojiPickerHandle } from './EmojiPicker';

export interface MarkdownInputBaseProps extends TextInputProps {
    value: string;
    onChangeText: (text: string) => void;
    wrapperStyle?: object;
    overlayStyle?: object;
    inputStyle?: object;
    multiline?: boolean;
}

export const MarkdownInputBase: React.FC<MarkdownInputBaseProps> = ({
    value,
    onChangeText,
    placeholder,
    wrapperStyle,
    overlayStyle,
    inputStyle,
    multiline,
    ...rest
}) => {
    const overlayScrollRef = useRef<ScrollView>(null);
    // <-- Create a ref for the EmojiPicker
    const emojiPickerRef = useRef<EmojiPickerHandle>(null);

    // Scroll syncing functions remain unchanged
    const handleVerticalScroll = (
        e: NativeSyntheticEvent<TextInputScrollEventData> & { nativeEvent: any }
    ) => {
        const offsetY =
            e.nativeEvent.contentOffset?.y ?? e.nativeEvent.target?.scrollTop;
        overlayScrollRef.current?.scrollTo({ y: offsetY, animated: false });
    };

    const handleHorizontalScroll = (
        e: NativeSyntheticEvent<TextInputScrollEventData> & { nativeEvent: any }
    ) => {
        const offsetX =
            e.nativeEvent.contentOffset?.x ?? e.nativeEvent.target?.scrollLeft;
        overlayScrollRef.current?.scrollTo({ x: offsetX, animated: false });
    };

    // Delegate key events to the EmojiPicker
    const handleKeyPressInternal = (e: any) => {
        emojiPickerRef.current?.handleKeyDown(e);
    };

    return (
        <View style={[styles.inputWrapper, wrapperStyle]}>
            <MarkdownOverlay
                ref={overlayScrollRef}
                value={value}
                multiline={multiline}
                overlayStyle={overlayStyle}
                inputStyle={inputStyle}
            />
            <TextInput
                style={[styles.input, inputStyle]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={COLORS.MainText}
                multiline={multiline}
                scrollEnabled
                textAlignVertical="top"
                onScroll={
                    multiline ? handleVerticalScroll : handleHorizontalScroll
                }
                // Use our internal key press handler
                {...(Platform.OS === 'web'
                    ? { onKeyPress: handleKeyPressInternal }
                    : { onKeyPress: handleKeyPressInternal })}
                scrollEventThrottle={16}
                {...rest}
            />
            {/* Render the EmojiPicker here so it overlays the text input */}
            <EmojiPicker
                ref={emojiPickerRef}
                messageText={value}
                setMessageText={onChangeText}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    inputWrapper: {
        position: 'relative',
        height: 200,
        borderWidth: 1,
        borderColor: 'gray',
    },
    input: {
        flex: 1,
        color: 'white',
        fontSize: 14,
        fontFamily: 'Roboto_400Regular',
        textAlignVertical: 'top',
        paddingHorizontal: 10,
        lineHeight: 20,
    },
});
