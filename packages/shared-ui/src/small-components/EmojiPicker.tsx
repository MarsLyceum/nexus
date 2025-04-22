import React, {
    useState,
    useEffect,
    useRef,
    forwardRef,
    useImperativeHandle,
    useMemo,
} from 'react';
import {
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
// @ts-expect-error no types
import emoji from 'emoji-dictionary';
import { useTheme, Theme } from '../theme';
import { MiniModal } from './MiniModal';

export type EmojiSuggestion = { name: string; emoji: string };

export type EmojiPickerProps = {
    messageText: string;
    setMessageText: (text: string) => void;
};

export interface EmojiPickerHandle {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleKeyDown: (e: any) => void;
}

const ITEM_HEIGHT = 40; // Approximate height of each suggestion item

const EmojiPickerComponent = (
    { messageText, setMessageText }: EmojiPickerProps,
    ref: React.Ref<unknown> | undefined
) => {
    const [emojiQuery, setEmojiQuery] = useState('');
    const [emojiSuggestions, setEmojiSuggestions] = useState<EmojiSuggestion[]>(
        []
    );
    const [activeEmojiIndex, setActiveEmojiIndex] = useState(0);
    const scrollRef = useRef<ScrollView>(null);
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    // Update suggestions based on colon query.
    useEffect(() => {
        const colonIndex = messageText.lastIndexOf(':');
        if (colonIndex !== -1) {
            const query = messageText.slice(colonIndex + 1);
            if (query.length > 0 && /^\w+$/.test(query)) {
                setEmojiQuery(query);
                const suggestions = emoji.names
                    .filter((name: string) =>
                        name.startsWith(query.toLowerCase())
                    )
                    .map((name: string) => ({
                        name,
                        emoji: emoji.getUnicode(name),
                    }));
                setEmojiSuggestions(suggestions);
                if (suggestions.length > 0) {
                    setActiveEmojiIndex(0);
                }
            } else {
                setEmojiQuery('');
                setEmojiSuggestions([]);
            }
        } else {
            setEmojiQuery('');
            setEmojiSuggestions([]);
        }
    }, [messageText]);

    const handleEmojiSelect = (selected: EmojiSuggestion) => {
        const colonIndex = messageText.lastIndexOf(':');
        if (colonIndex !== -1) {
            const newText =
                messageText.slice(0, colonIndex) +
                selected.emoji +
                messageText.slice(colonIndex + emojiQuery.length + 1);
            setMessageText(newText);
            setEmojiQuery('');
            setEmojiSuggestions([]);
        }
    };

    // This function contains the key handling logic.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleKeyDown = (e: any) => {
        const key = e?.nativeEvent?.key ?? e?.key;

        if (key === 'Escape') {
            setEmojiSuggestions([]);
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            e.preventDefault && e.preventDefault();
            return;
        }

        if (emojiSuggestions.length > 0) {
            // eslint-disable-next-line default-case
            switch (key) {
                case 'ArrowDown': {
                    setActiveEmojiIndex(
                        (prev) => (prev + 1) % emojiSuggestions.length
                    );
                    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                    e.preventDefault && e.preventDefault();

                    break;
                }
                case 'ArrowUp': {
                    setActiveEmojiIndex(
                        (prev) =>
                            (prev - 1 + emojiSuggestions.length) %
                            emojiSuggestions.length
                    );
                    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                    e.preventDefault && e.preventDefault();

                    break;
                }
                case 'Enter': {
                    handleEmojiSelect(emojiSuggestions[activeEmojiIndex]);
                    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                    e.preventDefault && e.preventDefault();

                    break;
                }
                // No default
            }
        }
    };

    // Expose handleKeyDown via ref so parent components can call it.
    useImperativeHandle(ref, () => ({
        handleKeyDown,
    }));

    // Scroll the active emoji into view when the active index changes.
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                y: activeEmojiIndex * ITEM_HEIGHT,
                animated: true,
            });
        }
    }, [activeEmojiIndex]);

    return (
        <MiniModal
            visible={emojiSuggestions.length > 0}
            onClose={() => setEmojiSuggestions([])}
        >
            {/* Removed focusable container; we now rely on delegated key events */}
            <View style={styles.container}>
                <ScrollView ref={scrollRef}>
                    {emojiSuggestions.map((suggestion, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => handleEmojiSelect(suggestion)}
                            style={[
                                styles.emojiSuggestionButton,
                                index === activeEmojiIndex &&
                                    styles.activeEmojiSuggestionButton,
                            ]}
                        >
                            <Text style={styles.emojiSuggestionText}>
                                {suggestion.emoji} {suggestion.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </MiniModal>
    );
};

export const EmojiPicker = forwardRef<EmojiPickerHandle, EmojiPickerProps>(
    EmojiPickerComponent
);

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            // You can style this container as needed.
            maxHeight: 250,
            padding: 10,
        },
        emojiSuggestionButton: {
            height: ITEM_HEIGHT,
            justifyContent: 'center',
            paddingHorizontal: 10,
            marginBottom: 5,
            backgroundColor: theme.colors.PrimaryBackground,
            borderRadius: 5,
        },
        activeEmojiSuggestionButton: {
            backgroundColor: theme.colors.SecondaryBackground,
        },
        emojiSuggestionText: {
            color: theme.colors.ActiveText,
            fontSize: 14,
        },
    });
}
