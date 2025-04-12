// MarkdownInputBase.tsx
import React, { useRef, useEffect, useMemo } from 'react';
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

import { useTheme, Theme } from '../theme';

import { MarkdownOverlay } from './MarkdownOverlay';
import { EmojiPicker, EmojiPickerHandle } from './EmojiPicker';

export interface MarkdownInputBaseProps extends TextInputProps {
    value: string;
    onChangeText: (text: string) => void;
    wrapperStyle?: object;
    overlayStyle?: object;
    inputStyle?: object;
    multiline?: boolean;
    // New props for dynamic dimensions as strings
    width?: string;
    height?: string;
    // New prop for background color
    backgroundColor?: string;
    // Add onKeyDown so that we can capture key events on web
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onKeyDown?: (e: any) => void;
}

export const MarkdownInputBase: React.FC<MarkdownInputBaseProps> = ({
    value,
    onChangeText,
    placeholder,
    wrapperStyle,
    overlayStyle,
    inputStyle,
    multiline,
    width,
    height,
    backgroundColor,
    onKeyDown, // Destructure onKeyDown here
    ...rest
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const overlayScrollRef = useRef<ScrollView>(null);
    // <-- Create a ref for the EmojiPicker
    const emojiPickerRef = useRef<EmojiPickerHandle>(null);
    // <-- Add a ref for the TextInput
    const textInputRef = useRef<TextInput>(null);

    // Scroll syncing functions remain unchanged
    const handleVerticalScroll = (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        e: NativeSyntheticEvent<TextInputScrollEventData> & { nativeEvent: any }
    ) => {
        const offsetY =
            e.nativeEvent.contentOffset?.y ?? e.nativeEvent.target?.scrollTop;
        overlayScrollRef.current?.scrollTo({ y: offsetY, animated: false });
    };

    const handleHorizontalScroll = (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        e: NativeSyntheticEvent<TextInputScrollEventData> & { nativeEvent: any }
    ) => {
        const offsetX =
            e.nativeEvent.contentOffset?.x ?? e.nativeEvent.target?.scrollLeft;
        overlayScrollRef.current?.scrollTo({ x: offsetX, animated: false });
    };

    // Delegate key events to the EmojiPicker
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleKeyPressInternal = (e: any) => {
        emojiPickerRef.current?.handleKeyDown(e);
    };

    // Convert height to a number if it's a string ending with "px" on mobile.
    let parsedHeight: string | number = height as string;
    if (
        typeof height === 'string' &&
        height.endsWith('px') &&
        Platform.OS !== 'web'
    ) {
        parsedHeight = Number.parseInt(height, 10);
    }

    // Convert width to a number if it's a string ending with "px" on mobile.
    let parsedWidth: string | number = width as string;
    if (
        typeof width === 'string' &&
        width.endsWith('px') &&
        Platform.OS !== 'web'
    ) {
        parsedWidth = Number.parseInt(width, 10);
    }

    // Only add width, height, and backgroundColor if they are provided
    const containerStyle: object = {
        ...(parsedWidth ? { width: parsedWidth } : {}),
        ...(parsedHeight ? { height: parsedHeight } : {}),
        ...(backgroundColor ? { backgroundColor } : {}), // applied to container
    };

    // Also apply backgroundColor to the overlay and input styles
    const overlayCombinedStyle = [
        {
            width: '100%',
            height: '100%',
            backgroundColor: backgroundColor || 'transparent',
        },
        overlayStyle,
    ];
    const inputCombinedStyle = [
        styles.input,
        {
            width: '100%',
            height: '100%',
            backgroundColor: backgroundColor || 'transparent',
        },
        inputStyle,
    ];

    // For web: Attach native keydown listener to capture keys like "Escape"
    // eslint-disable-next-line consistent-return
    useEffect(() => {
        if (Platform.OS === 'web' && textInputRef.current) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const node = textInputRef.current as any;
            const handleNativeKeyDown = (e: KeyboardEvent) => {
                if (onKeyDown) {
                    onKeyDown(e);
                }
                handleKeyPressInternal(e);
            };
            node.addEventListener('keydown', handleNativeKeyDown);
            return () => {
                node.removeEventListener('keydown', handleNativeKeyDown);
            };
        }
    }, [onKeyDown]);

    return (
        <View style={[styles.inputWrapper, containerStyle, wrapperStyle]}>
            <MarkdownOverlay
                ref={overlayScrollRef}
                value={value}
                multiline={multiline}
                // Ensure the overlay fills the container
                overlayStyle={overlayCombinedStyle}
                inputStyle={[{ width: '100%', height: '100%' }, inputStyle]}
            />
            <TextInput
                ref={textInputRef}
                style={inputCombinedStyle}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={theme.colors.MainText}
                multiline={multiline}
                scrollEnabled
                textAlignVertical="top"
                tabIndex={Platform.OS === 'web' ? 0 : undefined}
                onScroll={
                    multiline ? handleVerticalScroll : handleHorizontalScroll
                }
                // For non-web platforms, attach onKeyPress normally
                {...(Platform.OS !== 'web'
                    ? {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          onKeyPress: (e: any) => {
                              if (onKeyDown) {
                                  onKeyDown(e);
                              }
                              handleKeyPressInternal(e);
                          },
                      }
                    : {})}
                // @ts-expect-error scroll
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

function createStyles(theme: Theme) {
    return StyleSheet.create({
        inputWrapper: {
            position: 'relative',
            borderWidth: 1,
            borderColor: theme.colors.InactiveText,
        },
        input: {
            flex: 1,
            color: theme.colors.ActiveText,
            fontSize: 14,
            fontFamily: 'Roboto_400Regular',
            textAlignVertical: 'top',
            paddingHorizontal: 10,
            lineHeight: 20,
        },
    });
}
