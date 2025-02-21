import React from 'react';
import {
    View,
    Text,
    TextInput,
    TextInputProps,
    StyleSheet,
} from 'react-native';
import { COLORS } from '../constants';

// Utility function to render markdown-highlighted text.
// It splits the input text into lines to support block-level markdown (like blockquotes and lists),
// then processes each line with inline regex for formatting.
const renderHighlightedText = (text: string) => {
    const lines = text.split('\n');
    const renderedLines = lines.map((line, index) => {
        // Check for blockquotes: line starting with ">" or ">>>"
        if (/^>{1,3}\s+/.test(line)) {
            const content = line.replace(/^>{1,3}\s+/, '');
            return (
                <Text key={index} style={styles.blockquoteText}>
                    {content}
                </Text>
            );
        }
        // Check for list items: line starting with "-" or "1. "
        if (/^(-\s|\d+\.\s)/.test(line)) {
            return (
                <Text key={index} style={styles.listText}>
                    {line}
                </Text>
            );
        }
        // Process inline markdown
        let segments: JSX.Element[] = [];
        let lastIndex = 0;
        const regex =
            /(```([\s\S]+?)```)|(`([^`]+)`)|(__(.+?)__)|(\*\*\*([^*]+)\*\*\*)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)|(~~(.*?)~~)|(>!(.*?)!<)|(\|\|([\s\S]+?)\|\|)|(\[([^\]]+)\]\(([^)]+)\))|(!\[([^\]]*)\]\(([^)]+)\))|(https?:\/\/[^\s]+)/g;
        let match;
        let key = 0;
        while ((match = regex.exec(line)) !== null) {
            if (match.index > lastIndex) {
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {line.substring(lastIndex, match.index)}
                    </Text>
                );
            }
            // Group 1: Multi-line code block using triple backticks
            if (match[1]) {
                segments.push(
                    <Text key={key++} style={styles.codeBlockText}>
                        {match[2]}
                    </Text>
                );
            }
            // Group 3: Inline code using single backticks
            else if (match[3]) {
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {'`'}
                    </Text>
                );
                segments.push(
                    <Text key={key++} style={styles.codeText}>
                        {match[4]}
                    </Text>
                );
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {'`'}
                    </Text>
                );
            }
            // Group 5: Underline using double underscores __text__
            else if (match[5]) {
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {'__'}
                    </Text>
                );
                segments.push(
                    <Text key={key++} style={styles.underlineText}>
                        {match[6]}
                    </Text>
                );
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {'__'}
                    </Text>
                );
            }
            // Group 7: Bold+Italic using triple asterisks
            else if (match[7]) {
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {'***'}
                    </Text>
                );
                segments.push(
                    <Text key={key++} style={styles.boldItalicText}>
                        {match[8]}
                    </Text>
                );
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {'***'}
                    </Text>
                );
            }
            // Group 9: Bold using double asterisks
            else if (match[9]) {
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {'**'}
                    </Text>
                );
                segments.push(
                    <Text key={key++} style={styles.boldText}>
                        {match[10]}
                    </Text>
                );
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {'**'}
                    </Text>
                );
            }
            // Group 11: Italic using single asterisk
            else if (match[11]) {
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {'*'}
                    </Text>
                );
                segments.push(
                    <Text key={key++} style={styles.italicText}>
                        {match[12]}
                    </Text>
                );
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {'*'}
                    </Text>
                );
            }
            // Group 13: Italic using underscores (single underscores)
            else if (match[13]) {
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {'_'}
                    </Text>
                );
                segments.push(
                    <Text key={key++} style={styles.italicText}>
                        {match[14]}
                    </Text>
                );
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {'_'}
                    </Text>
                );
            }
            // Group 15: Strikethrough using double tildes
            else if (match[15]) {
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {'~~'}
                    </Text>
                );
                segments.push(
                    <Text key={key++} style={styles.strikethroughText}>
                        {match[16]}
                    </Text>
                );
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {'~~'}
                    </Text>
                );
            }
            // Group 17: Reddit spoiler (>!text!<)
            else if (match[17]) {
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {'>!'}
                    </Text>
                );
                segments.push(
                    <Text key={key++} style={styles.spoilerTextInline}>
                        {match[18]}
                    </Text>
                );
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {'!<'}
                    </Text>
                );
            }
            // Group 19: Discord spoiler (||text||)
            else if (match[19]) {
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {'||'}
                    </Text>
                );
                segments.push(
                    <Text key={key++} style={styles.spoilerTextInline}>
                        {match[20]}
                    </Text>
                );
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {'||'}
                    </Text>
                );
            }
            // Group 21: Link [text](URL) – we render just the link text styled as a link
            else if (match[21]) {
                segments.push(
                    <Text key={key++} style={styles.linkText}>
                        {match[22]}
                    </Text>
                );
            }
            // Group 24: Image ![alt](URL) – we render the alt text with image styling
            else if (match[24]) {
                segments.push(
                    <Text key={key++} style={styles.imageText}>
                        {match[25]}
                    </Text>
                );
            }
            // Group 27: Auto-link (plain URL)
            else if (match[27]) {
                segments.push(
                    <Text key={key++} style={styles.linkText}>
                        {match[28]}
                    </Text>
                );
            }
            lastIndex = regex.lastIndex;
        }
        if (lastIndex < line.length) {
            segments.push(
                <Text key={key++} style={styles.plainText}>
                    {line.substring(lastIndex)}
                </Text>
            );
        }
        return <Text key={index}>{segments}</Text>;
    });

    // Interleave lines with newline characters.
    return renderedLines.reduce((prev, curr, idx) => {
        if (idx === 0) return [curr];
        return [...prev, <Text key={`newline-${idx}`}>{'\n'}</Text>, curr];
    }, [] as JSX.Element[]);
};

export interface MarkdownTextInputProps extends TextInputProps {
    value: string;
    onChangeText: (text: string) => void;
}

export const MarkdownTextInput: React.FC<MarkdownTextInputProps> = ({
    value,
    onChangeText,
    placeholder,
    style,
    ...rest
}) => (
    <View style={styles.inputWrapper}>
        <Text style={styles.inputTextOverlay} pointerEvents="none">
            {renderHighlightedText(value)}
        </Text>
        <TextInput
            style={[styles.input, style]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="gray"
            {...rest}
        />
    </View>
);

const styles = StyleSheet.create({
    inputWrapper: {
        flex: 1,
        position: 'relative',
        height: 40,
    },
    inputTextOverlay: {
        position: 'absolute',
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
    plainText: {
        color: 'white',
        fontFamily: 'Roboto_400Regular',
    },
    codeText: {
        fontFamily: 'monospace',
        backgroundColor: '#2f3136',
        color: '#c7c7c7',
    },
    codeBlockText: {
        fontFamily: 'monospace',
        backgroundColor: '#2f3136',
        color: '#c7c7c7',
        padding: 4,
    },
    boldText: {
        fontWeight: 'bold',
        color: 'white',
        fontFamily: 'Roboto_700Bold',
    },
    italicText: {
        fontStyle: 'italic',
        color: 'white',
        fontFamily: 'Roboto_400Regular_Italic',
    },
    boldItalicText: {
        fontWeight: 'bold',
        fontStyle: 'italic',
        color: 'white',
        fontFamily: 'Roboto_700Bold_Italic',
    },
    underlineText: {
        textDecorationLine: 'underline',
        color: 'white',
        fontFamily: 'Roboto_400Regular',
    },
    strikethroughText: {
        textDecorationLine: 'line-through',
        color: 'white',
        fontFamily: 'Roboto_400Regular',
    },
    spoilerTextInline: {
        backgroundColor: 'grey',
        color: 'white',
        fontFamily: 'Roboto_400Regular',
    },
    blockquoteText: {
        borderLeftWidth: 4,
        borderLeftColor: COLORS.TextInput,
        paddingLeft: 8,
        color: 'lightgray',
        fontStyle: 'italic',
        fontFamily: 'Roboto_400Regular',
    },
    listText: {
        color: 'white',
        fontFamily: 'Roboto_400Regular',
    },
    linkText: {
        color: '#4ea1f3',
        textDecorationLine: 'underline',
        fontFamily: 'Roboto_400Regular',
    },
    imageText: {
        color: '#f3a14e',
        fontFamily: 'Roboto_400Regular',
    },
});
