import React, { useMemo } from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';

import { useTheme, Theme } from '../theme';

export interface MarkdownOverlayProps {
    value: string;
    multiline?: boolean;
    overlayStyle?: object;
    inputStyle?: object;
}

export const renderHighlightedText = (
    text: string,
    styles: ReturnType<typeof createStyles>
): React.JSX.Element[] => {
    const lines = text.split('\n');
    const renderedLines = lines.map((line, index) => {
        if (/^>{1,3}\s+/.test(line)) {
            const content = line.replace(/^>{1,3}\s+/, '');
            return (
                <Text key={index} style={styles.blockquoteText}>
                    {content}
                </Text>
            );
        }
        if (/^(-\s|\d+\.\s)/.test(line)) {
            return (
                <Text key={index} style={styles.listText}>
                    {line}
                </Text>
            );
        }
        const segments: React.JSX.Element[] = [];
        let lastIndex = 0;
        const regex =
            /(```([\S\s]+?)```)|(`([^`]+)`)|(__(.+?)__)|(\*\*\*([^*]+)\*\*\*)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)|(~~(.*?)~~)|(>!(.*?)!<)|(\|\|([\S\s]+?)\|\|)|(\[([^\]]+)]\(([^)]+)\))|(!\[([^\]]*)]\(([^)]+)\))|(https?:\/\/\S+)/g;
        let match;
        let key = 0;
        // eslint-disable-next-line no-cond-assign
        while ((match = regex.exec(line)) !== null) {
            if (match.index > lastIndex) {
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {line.slice(lastIndex, match.index)}
                    </Text>
                );
            }
            if (match[1]) {
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {'```'}
                    </Text>,
                    <Text key={key++} style={styles.codeBlockText}>
                        {match[2]}
                    </Text>,
                    <Text key={key++} style={styles.plainText}>
                        {'```'}
                    </Text>
                );
            } else if (match[3]) {
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {'`'}
                    </Text>,
                    <Text key={key++} style={styles.codeText}>
                        {match[4]}
                    </Text>,
                    <Text key={key++} style={styles.plainText}>
                        {'`'}
                    </Text>
                );
            } else if (match[5]) {
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {'__'}
                    </Text>,
                    <Text key={key++} style={styles.underlineText}>
                        {match[6]}
                    </Text>,
                    <Text key={key++} style={styles.plainText}>
                        {'__'}
                    </Text>
                );
            } else if (match[7]) {
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {'***'}
                    </Text>,
                    <Text key={key++} style={styles.boldItalicText}>
                        {match[8]}
                    </Text>,
                    <Text key={key++} style={styles.plainText}>
                        {'***'}
                    </Text>
                );
            } else if (match[9]) {
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {'**'}
                    </Text>,
                    <Text key={key++} style={styles.boldText}>
                        {match[10]}
                    </Text>,
                    <Text key={key++} style={styles.plainText}>
                        {'**'}
                    </Text>
                );
            } else if (match[11]) {
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {'*'}
                    </Text>,
                    <Text key={key++} style={styles.italicText}>
                        {match[12]}
                    </Text>,
                    <Text key={key++} style={styles.plainText}>
                        {'*'}
                    </Text>
                );
            } else if (match[13]) {
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {'_'}
                    </Text>,
                    <Text key={key++} style={styles.italicText}>
                        {match[14]}
                    </Text>,
                    <Text key={key++} style={styles.plainText}>
                        {'_'}
                    </Text>
                );
            } else if (match[15]) {
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {'~~'}
                    </Text>,
                    <Text key={key++} style={styles.strikethroughText}>
                        {match[16]}
                    </Text>,
                    <Text key={key++} style={styles.plainText}>
                        {'~~'}
                    </Text>
                );
            } else if (match[17]) {
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {'>!'}
                    </Text>,
                    <Text key={key++} style={styles.spoilerTextInline}>
                        {match[18]}
                    </Text>,
                    <Text key={key++} style={styles.plainText}>
                        {'!<'}
                    </Text>
                );
            } else if (match[19]) {
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {'||'}
                    </Text>,
                    <Text key={key++} style={styles.spoilerTextInline}>
                        {match[20]}
                    </Text>,
                    <Text key={key++} style={styles.plainText}>
                        {'||'}
                    </Text>
                );
            } else if (match[21]) {
                segments.push(
                    <Text key={key++} style={styles.plainText}>
                        {'['}
                    </Text>,
                    <Text key={key++} style={styles.linkText}>
                        {match[22]}
                    </Text>,
                    <Text key={key++} style={styles.plainText}>
                        {`](${match[23]})`}
                    </Text>
                );
            } else if (match[24]) {
                segments.push(
                    <Text key={key++} style={styles.imageText}>
                        {match[25]}
                    </Text>
                );
            } else if (match[27]) {
                segments.push(
                    <Text key={key++} style={styles.linkText}>
                        {match[27]}
                    </Text>
                );
            }
            lastIndex = regex.lastIndex;
        }
        if (lastIndex < line.length) {
            segments.push(
                <Text key={key++} style={styles.plainText}>
                    {line.slice(lastIndex)}
                </Text>
            );
        }
        return <Text key={index}>{segments}</Text>;
    });
    // eslint-disable-next-line unicorn/no-array-reduce
    return renderedLines.reduce((prev, curr, idx) => {
        if (idx === 0) return [curr];
        return [...prev, <Text key={`newline-${idx}`}>{'\n'}</Text>, curr];
    }, [] as React.JSX.Element[]);
};

const MarkdownOverlayComponent = (
    { value, multiline, overlayStyle, inputStyle }: MarkdownOverlayProps,
    ref: React.LegacyRef<ScrollView> | undefined
) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return multiline ? (
        <ScrollView
            ref={ref}
            style={[styles.overlayContainer, overlayStyle]}
            contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 25 }}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            pointerEvents="none"
        >
            <Text style={[styles.inputTextOverlay, inputStyle]}>
                {renderHighlightedText(value, styles)}
            </Text>
        </ScrollView>
    ) : (
        <ScrollView
            ref={ref}
            horizontal
            style={[styles.singleLineOverlay, overlayStyle]}
            contentContainerStyle={{ paddingVertical: 4 }}
            scrollEnabled
            showsHorizontalScrollIndicator={false}
            pointerEvents="none"
        >
            <Text
                style={[
                    styles.inputTextOverlay,
                    inputStyle,
                    { flexWrap: 'nowrap', paddingHorizontal: 10 },
                ]}
            >
                {renderHighlightedText(value, styles)}
            </Text>
        </ScrollView>
    );
};

export const MarkdownOverlay = React.forwardRef<
    ScrollView,
    MarkdownOverlayProps
>(MarkdownOverlayComponent);

function createStyles(theme: Theme) {
    return StyleSheet.create({
        overlayContainer: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
        },
        singleLineOverlay: {
            // additional styles can be added here if needed
        },
        inputTextOverlay: {
            fontSize: 14,
            color: theme.colors.ActiveText,
            lineHeight: 20,
        },
        plainText: {
            color: theme.colors.ActiveText,
            fontFamily: 'Roboto_400Regular',
            fontSize: 14,
            lineHeight: 20,
        },
        codeText: {
            fontFamily: 'monospace',
            backgroundColor: theme.colors.SecondaryBackground,
            color: theme.colors.MainText,
        },
        codeBlockText: {
            fontFamily: 'monospace',
            backgroundColor: theme.colors.SecondaryBackground,
            color: theme.colors.MainText,
        },
        boldText: {
            fontWeight: 'bold',
            color: theme.colors.ActiveText,
            fontFamily: 'Roboto_700Bold',
        },
        italicText: {
            fontStyle: 'italic',
            color: theme.colors.ActiveText,
            fontFamily: 'Roboto_400Regular_Italic',
        },
        boldItalicText: {
            fontWeight: 'bold',
            fontStyle: 'italic',
            color: theme.colors.ActiveText,
            fontFamily: 'Roboto_700Bold_Italic',
        },
        underlineText: {
            textDecorationLine: 'underline',
            color: theme.colors.ActiveText,
            fontFamily: 'Roboto_400Regular',
        },
        strikethroughText: {
            textDecorationLine: 'line-through',
            color: theme.colors.ActiveText,
            fontFamily: 'Roboto_400Regular',
        },
        spoilerTextInline: {
            backgroundColor: 'grey',
            color: theme.colors.ActiveText,
            fontFamily: 'Roboto_400Regular',
        },
        blockquoteText: {
            borderLeftWidth: 4,
            borderLeftColor: theme.colors.TextInput,
            paddingLeft: 8,
            color: theme.colors.MainText,
            fontStyle: 'italic',
            fontFamily: 'Roboto_400Regular',
        },
        listText: {
            color: theme.colors.ActiveText,
            fontFamily: 'Roboto_400Regular',
        },
        linkText: {
            color: theme.colors.Link,
            textDecorationLine: 'underline',
            fontFamily: 'Roboto_400Regular',
        },
        imageText: {
            color: '#f3a14e',
            fontFamily: 'Roboto_400Regular',
        },
    });
}
