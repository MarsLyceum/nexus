import React from 'react';
import {
    View,
    Text,
    TextInput,
    TextInputProps,
    StyleSheet,
} from 'react-native';
import { COLORS } from '../constants';

export interface MarkdownInputBaseProps extends TextInputProps {
    value: string;
    onChangeText: (text: string) => void;
    wrapperStyle?: object;
    overlayStyle?: object;
    inputStyle?: object;
}

// Shared utility function to render markdown-highlighted text.
export const renderHighlightedText = (text: string) => {
    const lines = text.split('\n');
    const renderedLines = lines.map((line, index) => {
        // Check for blockquotes: line starting with ">" or ">>>"
        if (/^>{1,3}\s+/.test(line)) {
            const content = line.replace(/^>{1,3}\s+/, '');
            return (
                <Text key={index} style={baseStyles.blockquoteText}>
                    {content}
                </Text>
            );
        }
        // Check for list items: line starting with "-" or "1. "
        if (/^(-\s|\d+\.\s)/.test(line)) {
            return (
                <Text key={index} style={baseStyles.listText}>
                    {line}
                </Text>
            );
        }
        // Process inline markdown
        const segments: JSX.Element[] = [];
        let lastIndex = 0;
        const regex =
            /(```([\S\s]+?)```)|(`([^`]+)`)|(__(.+?)__)|(\*\*\*([^*]+)\*\*\*)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)|(~~(.*?)~~)|(>!(.*?)!<)|(\|\|([\S\s]+?)\|\|)|(\[([^\]]+)]\(([^)]+)\))|(!\[([^\]]*)]\(([^)]+)\))|(https?:\/\/\S+)/g;
        let match;
        let key = 0;
        while ((match = regex.exec(line)) !== null) {
            if (match.index > lastIndex) {
                segments.push(
                    <Text key={key++} style={baseStyles.plainText}>
                        {line.slice(lastIndex, match.index)}
                    </Text>
                );
            }
            // Group 1: Multi-line code block using triple backticks
            if (match[1]) {
                segments.push(
                    <Text key={key++} style={baseStyles.plainText}>
                        {'```'}
                    </Text>,
                    <Text key={key++} style={baseStyles.codeBlockText}>
                        {match[2]}
                    </Text>,
                    <Text key={key++} style={baseStyles.plainText}>
                        {'```'}
                    </Text>
                );
            }
            // Group 3: Inline code using single backticks
            else if (match[3]) {
                segments.push(
                    <Text key={key++} style={baseStyles.plainText}>
                        {'`'}
                    </Text>,
                    <Text key={key++} style={baseStyles.codeText}>
                        {match[4]}
                    </Text>,
                    <Text key={key++} style={baseStyles.plainText}>
                        {'`'}
                    </Text>
                );
            }
            // Group 5: Underline using double underscores __text__
            else if (match[5]) {
                segments.push(
                    <Text key={key++} style={baseStyles.plainText}>
                        {'__'}
                    </Text>,
                    <Text key={key++} style={baseStyles.underlineText}>
                        {match[6]}
                    </Text>,
                    <Text key={key++} style={baseStyles.plainText}>
                        {'__'}
                    </Text>
                );
            }
            // Group 7: Bold+Italic using triple asterisks
            else if (match[7]) {
                segments.push(
                    <Text key={key++} style={baseStyles.plainText}>
                        {'***'}
                    </Text>,
                    <Text key={key++} style={baseStyles.boldItalicText}>
                        {match[8]}
                    </Text>,
                    <Text key={key++} style={baseStyles.plainText}>
                        {'***'}
                    </Text>
                );
            }
            // Group 9: Bold using double asterisks
            else if (match[9]) {
                segments.push(
                    <Text key={key++} style={baseStyles.plainText}>
                        {'**'}
                    </Text>,
                    <Text key={key++} style={baseStyles.boldText}>
                        {match[10]}
                    </Text>,
                    <Text key={key++} style={baseStyles.plainText}>
                        {'**'}
                    </Text>
                );
            }
            // Group 11: Italic using single asterisk
            else if (match[11]) {
                segments.push(
                    <Text key={key++} style={baseStyles.plainText}>
                        {'*'}
                    </Text>,
                    <Text key={key++} style={baseStyles.italicText}>
                        {match[12]}
                    </Text>,
                    <Text key={key++} style={baseStyles.plainText}>
                        {'*'}
                    </Text>
                );
            }
            // Group 13: Italic using underscores
            else if (match[13]) {
                segments.push(
                    <Text key={key++} style={baseStyles.plainText}>
                        {'_'}
                    </Text>,
                    <Text key={key++} style={baseStyles.italicText}>
                        {match[14]}
                    </Text>,
                    <Text key={key++} style={baseStyles.plainText}>
                        {'_'}
                    </Text>
                );
            }
            // Group 15: Strikethrough using double tildes
            else if (match[15]) {
                segments.push(
                    <Text key={key++} style={baseStyles.plainText}>
                        {'~~'}
                    </Text>,
                    <Text key={key++} style={baseStyles.strikethroughText}>
                        {match[16]}
                    </Text>,
                    <Text key={key++} style={baseStyles.plainText}>
                        {'~~'}
                    </Text>
                );
            }
            // Group 17: Reddit spoiler (>!text!<)
            else if (match[17]) {
                segments.push(
                    <Text key={key++} style={baseStyles.plainText}>
                        {'>!'}
                    </Text>,
                    <Text key={key++} style={baseStyles.spoilerTextInline}>
                        {match[18]}
                    </Text>,
                    <Text key={key++} style={baseStyles.plainText}>
                        {'!<'}
                    </Text>
                );
            }
            // Group 19: Discord spoiler (||text||)
            else if (match[19]) {
                segments.push(
                    <Text key={key++} style={baseStyles.plainText}>
                        {'||'}
                    </Text>,
                    <Text key={key++} style={baseStyles.spoilerTextInline}>
                        {match[20]}
                    </Text>,
                    <Text key={key++} style={baseStyles.plainText}>
                        {'||'}
                    </Text>
                );
            }
            // Group 21: Link [text](URL) – render all text, styling only the part inside the square brackets
            else if (match[21]) {
                segments.push(
                    <Text key={key++} style={baseStyles.plainText}>
                        {'['}
                    </Text>,
                    <Text key={key++} style={baseStyles.linkText}>
                        {match[22]}
                    </Text>,
                    <Text key={key++} style={baseStyles.plainText}>
                        {'](' + match[23] + ')'}
                    </Text>
                );
            }
            // Group 24: Image ![alt](URL) – render the alt text with image styling
            else if (match[24]) {
                segments.push(
                    <Text key={key++} style={baseStyles.imageText}>
                        {match[25]}
                    </Text>
                );
            }
            // Group 27: Auto-link (plain URL)
            else if (match[27]) {
                segments.push(
                    <Text key={key++} style={baseStyles.linkText}>
                        {match[28]}
                    </Text>
                );
            }
            lastIndex = regex.lastIndex;
        }
        if (lastIndex < line.length) {
            segments.push(
                <Text key={key++} style={baseStyles.plainText}>
                    {line.slice(lastIndex)}
                </Text>
            );
        }
        return <Text key={index}>{segments}</Text>;
    });

    // Interleave with newline characters.
    return renderedLines.reduce((prev, curr, idx) => {
        if (idx === 0) return [curr];
        return [...prev, <Text key={`newline-${idx}`}>{'\n'}</Text>, curr];
    }, [] as JSX.Element[]);
};

export const MarkdownInputBase: React.FC<MarkdownInputBaseProps> = ({
    value,
    onChangeText,
    placeholder,
    wrapperStyle,
    overlayStyle,
    inputStyle,
    ...rest
}) => {
    return (
        <View style={[baseStyles.inputWrapper, wrapperStyle]}>
            <Text
                style={[baseStyles.inputTextOverlay, overlayStyle]}
                pointerEvents="none"
            >
                {renderHighlightedText(value)}
            </Text>
            <TextInput
                style={[baseStyles.input, inputStyle]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="gray"
                {...rest}
            />
        </View>
    );
};

const baseStyles = StyleSheet.create({
    inputWrapper: {
        flex: 1,
        position: 'relative',
    },
    inputTextOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        fontSize: 14,
        color: 'white',
        // REMOVED fontFamily to prevent overriding child styles:
        // fontFamily: 'Roboto_400Regular',
    },
    input: {
        color: 'white',
        fontSize: 14,
        fontFamily: 'Roboto_400Regular',
        textAlignVertical: 'top',
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
