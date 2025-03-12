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

export interface MarkdownInputBaseProps extends TextInputProps {
    value: string;
    onChangeText: (text: string) => void;
    onKeyPress?: (e: any) => void;
    wrapperStyle?: object;
    overlayStyle?: object;
    inputStyle?: object;
    multiline?: boolean;
}

export const MarkdownInputBase: React.FC<MarkdownInputBaseProps> = ({
    value,
    onChangeText,
    onKeyPress,
    placeholder,
    wrapperStyle,
    overlayStyle,
    inputStyle,
    multiline,
    ...rest
}) => {
    const overlayScrollRef = useRef<ScrollView>(null);

    // Sync scroll position for multiline and single-line modes.
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
                {...(Platform.OS === 'web' && { onKeyPress })}
                scrollEventThrottle={16}
                {...rest}
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
