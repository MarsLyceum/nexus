import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

// Spoiler component is used in markdown rendering for spoiler syntax.
const Spoiler: React.FC<{ text: string }> = ({ text }) => {
    const [revealed, setRevealed] = React.useState(false);
    return (
        <Text
            onPress={() => setRevealed(!revealed)}
            style={revealed ? styles.spoilerRevealed : styles.spoilerHidden}
        >
            {text}
        </Text>
    );
};

// This function processes markdown syntax and returns an array of JSX elements.
export const renderMarkdown = (text: string): JSX.Element[] => {
    const lines = text.split('\n');
    const renderedLines = lines.map((line, index) => {
        let segments: JSX.Element[] = [];
        let lastIndex = 0;
        let key = 0;
        // Regex covers code blocks, inline code, underline, bold+italic, bold, italic, strikethrough,
        // spoilers, links, images, and auto-links.
        const regex =
            /(```([\s\S]+?)```)|(`([^`]+)`)|(__(.+?)__)|(\*\*\*([^*]+)\*\*\*)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)|(~~(.*?)~~)|(>!(.*?)!<)|(\|\|([\s\S]+?)\|\|)|(\[([^\]]+)\]\(([^)]+)\))|(!\[([^\]]*)\]\(([^)]+)\))|(https?:\/\/[^\s]+)/g;
        let match;
        while ((match = regex.exec(line)) !== null) {
            // Add plain text preceding the markdown match.
            if (match.index > lastIndex) {
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {line.substring(lastIndex, match.index)}
                    </Text>
                );
            }
            // Multi-line code block.
            if (match[1]) {
                segments.push(
                    <Text key={key++} style={styles.codeBlockText}>
                        {match[2]}
                    </Text>
                );
            }
            // Inline code.
            else if (match[3]) {
                segments.push(
                    <Text key={key++} style={styles.codeText}>
                        {match[4]}
                    </Text>
                );
            }
            // Underline.
            else if (match[5]) {
                segments.push(
                    <Text key={key++} style={styles.underlineText}>
                        {match[6]}
                    </Text>
                );
            }
            // Bold+Italic.
            else if (match[7]) {
                segments.push(
                    <Text key={key++} style={styles.boldItalicText}>
                        {match[8]}
                    </Text>
                );
            }
            // Bold.
            else if (match[9]) {
                segments.push(
                    <Text key={key++} style={styles.boldText}>
                        {match[10]}
                    </Text>
                );
            }
            // Italic (asterisks).
            else if (match[11]) {
                segments.push(
                    <Text key={key++} style={styles.italicText}>
                        {match[12]}
                    </Text>
                );
            }
            // Italic (underscores).
            else if (match[13]) {
                segments.push(
                    <Text key={key++} style={styles.italicText}>
                        {match[14]}
                    </Text>
                );
            }
            // Strikethrough.
            else if (match[15]) {
                segments.push(
                    <Text key={key++} style={styles.strikethroughText}>
                        {match[16]}
                    </Text>
                );
            }
            // Reddit-style spoiler.
            else if (match[17]) {
                segments.push(<Spoiler key={key++} text={match[18]} />);
            }
            // Discord-style spoiler.
            else if (match[19]) {
                segments.push(<Spoiler key={key++} text={match[20]} />);
            }
            // Link.
            else if (match[21]) {
                segments.push(
                    <Text key={key++} style={styles.linkText}>
                        {match[22]}
                    </Text>
                );
            }
            // Image (render the alt text).
            else if (match[24]) {
                segments.push(
                    <Text key={key++} style={styles.imageText}>
                        {match[25]}
                    </Text>
                );
            }
            // Auto-link.
            else if (match[27]) {
                segments.push(
                    <Text key={key++} style={styles.linkText}>
                        {match[28]}
                    </Text>
                );
            }
            lastIndex = regex.lastIndex;
        }
        // Append any remaining plain text.
        if (lastIndex < line.length) {
            segments.push(
                <Text key={key++} style={styles.plainText}>
                    {line.substring(lastIndex)}
                </Text>
            );
        }
        return <Text key={index}>{segments}</Text>;
    });
    // Join lines with newline characters.
    return renderedLines.reduce((prev, curr, idx) => {
        if (idx === 0) return [curr];
        return [...prev, <Text key={`newline-${idx}`}>{'\n'}</Text>, curr];
    }, [] as JSX.Element[]);
};

const styles = StyleSheet.create({
    plainText: {
        color: 'white',
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
    },
    italicText: {
        fontStyle: 'italic',
        color: 'white',
    },
    boldItalicText: {
        fontWeight: 'bold',
        fontStyle: 'italic',
        color: 'white',
    },
    underlineText: {
        textDecorationLine: 'underline',
        color: 'white',
    },
    strikethroughText: {
        textDecorationLine: 'line-through',
        color: 'white',
    },
    spoilerHidden: {
        backgroundColor: COLORS.White,
        color: COLORS.White,
    },
    spoilerRevealed: {
        backgroundColor: 'transparent',
        color: COLORS.White,
    },
    linkText: {
        color: '#4ea1f3',
        textDecorationLine: 'underline',
    },
    imageText: {
        color: '#f3a14e',
    },
});
