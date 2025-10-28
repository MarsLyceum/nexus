import React, { useMemo } from 'react';
import { ScrollView, Text, StyleSheet, Platform } from 'react-native';

import { useTheme, Theme } from '../theme';
import { Spacing, Typography } from '../constants/designSystem';

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
    const pointerEventsValue = Platform.OS === 'web' ? undefined : 'none';
    const multilineContainerStyle =
        Platform.OS === 'web'
            ? [
                  { ...styles.overlayContainer, pointerEvents: 'none' },
                  overlayStyle,
              ]
            : [styles.overlayContainer, overlayStyle];
    const singleLineContainerStyle =
        Platform.OS === 'web'
            ? [
                  { ...styles.singleLineOverlay, pointerEvents: 'none' },
                  overlayStyle,
              ]
            : [styles.singleLineOverlay, overlayStyle];

    return multiline ? (
        <ScrollView
            ref={ref}
            style={multilineContainerStyle}
            contentContainerStyle={styles.multilineContentContainer}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            pointerEvents={pointerEventsValue}
        >
            <Text style={[styles.inputTextOverlay, inputStyle]}>
                {renderHighlightedText(value, styles)}
            </Text>
        </ScrollView>
    ) : (
        <ScrollView
            ref={ref}
            horizontal
            style={singleLineContainerStyle}
            contentContainerStyle={styles.singleLineContentContainer}
            scrollEnabled
            showsHorizontalScrollIndicator={false}
            pointerEvents={pointerEventsValue}
        >
            <Text
                style={[
                    styles.inputTextOverlay,
                    inputStyle,
                    styles.singleLineText,
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
        singleLineOverlay: {},
        multilineContentContainer: {
            paddingHorizontal: Spacing.MD,
            paddingBottom: Spacing.XXL,
        },
        singleLineContentContainer: {
            paddingVertical: Spacing.SM,
        },
        singleLineText: {
            flexWrap: 'nowrap',
            paddingHorizontal: Spacing.MD,
        },
        inputTextOverlay: {
            ...Typography.Code,
            fontFamily: theme.fonts.primary?.regular,
            color: theme.colors.ActiveText,
        },
        plainText: {
            ...Typography.Code,
            fontFamily: theme.fonts.primary?.regular,
            color: theme.colors.ActiveText,
        },
        codeText: {
            ...Typography.Code,
            fontFamily:
                theme.fonts.monospace?.regular ??
                Platform.select({
                    web: 'monospace',
                    default: 'Courier',
                }),
            backgroundColor: theme.colors.SecondaryBackground,
            color: theme.colors.MainText,
        },
        codeBlockText: {
            ...Typography.Code,
            fontFamily:
                theme.fonts.monospace?.regular ??
                Platform.select({
                    web: 'monospace',
                    default: 'Courier',
                }),
            backgroundColor: theme.colors.SecondaryBackground,
            color: theme.colors.MainText,
        },
        boldText: {
            ...Typography.Code,
            fontFamily: theme.fonts.primary?.bold,
            color: theme.colors.ActiveText,
        },
        italicText: {
            ...Typography.Code,
            fontFamily: theme.fonts.primary?.regular,
            fontStyle: 'italic',
            color: theme.colors.ActiveText,
        },
        boldItalicText: {
            ...Typography.Code,
            fontFamily: theme.fonts.primary?.bold,
            fontStyle: 'italic',
            color: theme.colors.ActiveText,
        },
        underlineText: {
            ...Typography.Code,
            fontFamily: theme.fonts.primary?.regular,
            textDecorationLine: 'underline',
            color: theme.colors.ActiveText,
        },
        strikethroughText: {
            ...Typography.Code,
            fontFamily: theme.fonts.primary?.regular,
            textDecorationLine: 'line-through',
            color: theme.colors.ActiveText,
        },
        spoilerTextInline: {
            ...Typography.Code,
            fontFamily: theme.fonts.primary?.regular,
            backgroundColor: theme.colors.InactiveText,
            color: theme.colors.ActiveText,
        },
        blockquoteText: {
            ...Typography.Code,
            fontFamily: theme.fonts.primary?.regular,
            borderLeftWidth: 4,
            borderLeftColor: theme.colors.TextInput,
            paddingLeft: Spacing.SM,
            color: theme.colors.MainText,
            fontStyle: 'italic',
        },
        listText: {
            ...Typography.Code,
            fontFamily: theme.fonts.primary?.regular,
            color: theme.colors.ActiveText,
        },
        linkText: {
            ...Typography.Code,
            fontFamily: theme.fonts.primary?.regular,
            color: theme.colors.Link,
            textDecorationLine: 'underline',
        },
        imageText: {
            ...Typography.Code,
            fontFamily: theme.fonts.primary?.regular,
            color: theme.colors.Secondary,
        },
    });
}
