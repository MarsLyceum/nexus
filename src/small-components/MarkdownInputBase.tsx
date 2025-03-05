import React, { useRef } from 'react';
import {
    ScrollView,
    View,
    Text,
    TextInput,
    TextInputProps,
    StyleSheet,
    NativeSyntheticEvent,
    TextInputScrollEventData,
} from 'react-native';
import { COLORS } from '../constants';

export interface MarkdownInputBaseProps extends TextInputProps {
    value: string;
    onChangeText: (text: string) => void;
    wrapperStyle?: object;
    overlayStyle?: object;
    inputStyle?: object;
}

export const renderHighlightedText = (text: string) => {
    const lines = text.split('\n');
    const renderedLines = lines.map((line, index) => {
        if (/^>{1,3}\s+/.test(line)) {
            const content = line.replace(/^>{1,3}\s+/, '');
            return (
                <Text key={index} style={baseStyles.blockquoteText}>
                    {content}
                </Text>
            );
        }
        if (/^(-\s|\d+\.\s)/.test(line)) {
            return (
                <Text key={index} style={baseStyles.listText}>
                    {line}
                </Text>
            );
        }
        const segments: JSX.Element[] = [];
        let lastIndex = 0;
        const regex =
            /(```([\S\s]+?)```)|(`([^`]+)`)|(__(.+?)__)|(\*\*\*([^*]+)\*\*\*)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)|(~~(.*?)~~)|(>!(.*?)!<)|(\|\|([\S\s]+?)\|\|)|(\[([^\]]+)]\(([^)]+)\))|(!\[([^\]]*)]\(([^)]+)\))|(https?:\/\/\S+)/g;
        let match;
        let key = 0;
        // eslint-disable-next-line no-cond-assign
        while ((match = regex.exec(line)) !== null) {
            if (match.index > lastIndex) {
                segments.push(
                    <Text key={key++} style={baseStyles.plainText}>
                        {line.slice(lastIndex, match.index)}
                    </Text>
                );
            }
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
            } else if (match[3]) {
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
            } else if (match[5]) {
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
            } else if (match[7]) {
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
            } else if (match[9]) {
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
            } else if (match[11]) {
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
            } else if (match[13]) {
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
            } else if (match[15]) {
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
            } else if (match[17]) {
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
            } else if (match[19]) {
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
            } else if (match[21]) {
                segments.push(
                    <Text key={key++} style={baseStyles.plainText}>
                        {'['}
                    </Text>,
                    <Text key={key++} style={baseStyles.linkText}>
                        {match[22]}
                    </Text>,
                    <Text key={key++} style={baseStyles.plainText}>
                        {`](${match[23]})`}
                    </Text>
                );
            } else if (match[24]) {
                segments.push(
                    <Text key={key++} style={baseStyles.imageText}>
                        {match[25]}
                    </Text>
                );
            } else if (match[27]) {
                segments.push(
                    <Text key={key++} style={baseStyles.linkText}>
                        {match[27]}
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
    // eslint-disable-next-line unicorn/no-array-reduce
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
    multiline,
    ...rest
}) => {
    const overlayScrollRef = useRef<ScrollView>(null);

    // For multiline, sync vertical scroll.
    const handleVerticalScroll = (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        e: NativeSyntheticEvent<TextInputScrollEventData> & { nativeEvent: any }
    ) => {
        const offsetY =
            e.nativeEvent.contentOffset?.y ?? e.nativeEvent.target?.scrollTop;
        overlayScrollRef.current?.scrollTo({ y: offsetY, animated: false });
    };

    // For non-multiline, sync horizontal scroll.
    const handleHorizontalScroll = (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        e: NativeSyntheticEvent<TextInputScrollEventData> & { nativeEvent: any }
    ) => {
        const offsetX =
            e.nativeEvent.contentOffset?.x ?? e.nativeEvent.target?.scrollLeft;
        overlayScrollRef.current?.scrollTo({ x: offsetX, animated: false });
    };

    return (
        <View style={[baseStyles.inputWrapper, wrapperStyle]}>
            {multiline ? (
                <ScrollView
                    ref={overlayScrollRef}
                    style={[baseStyles.overlayContainer, overlayStyle]}
                    contentContainerStyle={{
                        paddingHorizontal: 10,
                        paddingBottom: 25,
                    }}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                    pointerEvents="none"
                >
                    <Text style={[baseStyles.inputTextOverlay, inputStyle]}>
                        {renderHighlightedText(value)}
                    </Text>
                </ScrollView>
            ) : (
                // For non-multiline, use a horizontal ScrollView.
                // Remove horizontal padding from contentContainerStyle and apply it directly on the Text.
                <ScrollView
                    ref={overlayScrollRef}
                    horizontal
                    style={[baseStyles.singleLineOverlay, overlayStyle]}
                    contentContainerStyle={{
                        paddingVertical: 4,
                    }}
                    scrollEnabled
                    showsHorizontalScrollIndicator={false}
                    pointerEvents="none"
                >
                    <Text
                        style={[
                            baseStyles.inputTextOverlay,
                            inputStyle,
                            { flexWrap: 'nowrap', paddingHorizontal: 10 },
                        ]}
                    >
                        {renderHighlightedText(value)}
                    </Text>
                </ScrollView>
            )}
            <TextInput
                style={[baseStyles.input, inputStyle]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="gray"
                multiline={multiline}
                scrollEnabled
                textAlignVertical="top"
                onScroll={
                    multiline ? handleVerticalScroll : handleHorizontalScroll
                }
                // @ts-expect-error prop
                scrollEventThrottle={16}
                {...rest}
            />
        </View>
    );
};

const baseStyles = StyleSheet.create({
    inputWrapper: {
        position: 'relative',
        height: 200,
        borderWidth: 1,
        borderColor: 'gray',
    },
    overlayContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    singleLineOverlay: {
        // Remove any additional horizontal padding
    },
    inputTextOverlay: {
        fontSize: 14,
        color: 'white',
        lineHeight: 20,
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
    plainText: {
        color: 'white',
        fontFamily: 'Roboto_400Regular',
        fontSize: 14,
        lineHeight: 20,
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
