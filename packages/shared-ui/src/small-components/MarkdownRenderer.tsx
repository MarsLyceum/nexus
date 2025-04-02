import React, { useMemo, useCallback } from 'react';
import {
    Text,
    StyleSheet,
    Dimensions,
    Linking,
    View,
    TouchableOpacity,
    Platform, // <-- Import Platform
} from 'react-native';
import MarkdownIt from 'markdown-it';
import RenderHTML, {
    defaultHTMLElementModels,
    HTMLContentModel,
} from 'react-native-render-html';
import { COLORS } from '../constants';

// ---------------------
// Styles
// ---------------------
const styles = StyleSheet.create({
    document: {
        color: 'white',
        fontSize: 16,
        lineHeight: 22,
        fontFamily: 'Roboto_400Regular',
    },
    code_inline: {
        fontFamily: 'monospace',
        backgroundColor: '#2f3136',
        color: '#c7c7c7',
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    blockquote: {
        backgroundColor: COLORS.AppBackground,
        padding: 10,
        borderLeftColor: '#4ea1f3',
        borderLeftWidth: 4,
        marginVertical: 8,
    },
    spoilerText: {
        fontSize: 16,
    },
    linkText: {
        color: COLORS.Link,
        textDecorationLine: 'underline',
        fontSize: 16,
        fontFamily: 'Roboto_400Regular', // <-- Added fontFamily for both web and mobile
    },
    heading1: {
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 8,
        marginBottom: 8,
        color: COLORS.White,
        fontFamily: 'Roboto_700Bold',
        lineHeight: 40,
    },
    ellipsisText: {
        color: 'white',
        fontSize: 18,
    },
    // New style for emoji-only content
    emojiLarge: {
        fontSize: 64,
        textAlign: 'left',
        fontFamily: 'Roboto_400Regular',
    },
});

// ---------------------
// Helper function to extract text recursively from tnode children
// ---------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extractTextFromTnode = (tnode: any): string => {
    if (tnode.data) {
        return tnode.data;
    }
    if (tnode.children && Array.isArray(tnode.children)) {
        return tnode.children
            .map((element: unknown) => extractTextFromTnode(element))
            .join('');
    }
    return '';
};

// ---------------------
// Helper function to check if text is only emojis (and whitespace)
// ---------------------
const isOnlyEmojis = (text: string): boolean => {
    const emojiRegex =
        /^(?:\s*(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s*)+$/u;
    return emojiRegex.test(text.trim());
};

// ---------------------
// Inline Spoiler Component (toggles between whited out and revealed text)
// ---------------------
const InlineSpoiler: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [revealed, setRevealed] = React.useState(false);
    return (
        <Text
            onPress={() => setRevealed((prev) => !prev)}
            // Allow text selection only when the spoiler is revealed.
            selectable={revealed}
            style={[
                styles.spoilerText,
                {
                    backgroundColor: revealed
                        ? COLORS.AppBackground
                        : COLORS.White,
                    // When hidden: white text on a white background ("whited out").
                    // When revealed: white text on the app background.
                    color: COLORS.White,
                    alignSelf: 'flex-start',
                },
            ]}
        >
            {children}
        </Text>
    );
};

// ---------------------
// Custom Inline Link Component
// ---------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const InlineLink: React.FC<{ tnode: any }> = ({ tnode }) => {
    let href = tnode.attributes?.href || '';
    if (!/^https?:\/\//.test(href)) {
        href = `http://${href}`;
    }
    const content =
        tnode.domNode?.textContent || extractTextFromTnode(tnode) || '';

    // For web, render an anchor (<a>) with a web-specific style mapping.
    if (Platform.OS === 'web') {
        const webStyle = {
            color: styles.linkText.color,
            textDecoration: styles.linkText.textDecorationLine, // CSS property for text decoration
            fontSize: styles.linkText.fontSize,
            fontFamily: styles.linkText.fontFamily, // <-- Ensuring same font family
        };
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={webStyle}
            >
                {content}
            </a>
        );
    }
    // For native environments, render as a Text element with onPress.
    return (
        <Text
            onPress={() => {
                if (href) {
                    void Linking.openURL(href);
                }
            }}
            selectable
            style={[styles.linkText, { alignSelf: 'flex-start' }]}
        >
            {content}
        </Text>
    );
};

// ---------------------
// Markdown-It Plugin for Discord-Style Inline Spoilers (using ||spoiler||)
// ---------------------
function inlineSpoilerPlugin(md: MarkdownIt) {
    // eslint-disable-next-line unicorn/consistent-function-scoping, @typescript-eslint/no-explicit-any
    function tokenize(state: any, silent: boolean) {
        const startPos = state.pos;
        if (state.src.slice(startPos, startPos + 2) !== '||') return false;
        const end = state.src.indexOf('||', startPos + 2);
        if (end === -1) return false;
        if (!silent) {
            const token = state.push('spoiler', 'spoiler', 0);
            token.content = state.src.slice(startPos + 2, end);
        }
        // eslint-disable-next-line no-param-reassign
        state.pos = end + 2;
        return true;
    }
    // Register before the "text" rule so inline spoilers are caught even mid-string.
    md.inline.ruler.before('text', 'spoiler', tokenize);
}

// ---------------------
// Markdown-It Plugin for Reddit-Style Inline Spoilers (using >!spoiler!<)
// ---------------------
function redditSpoilerPlugin(md: MarkdownIt) {
    // eslint-disable-next-line unicorn/consistent-function-scoping, @typescript-eslint/no-explicit-any
    function tokenize(state: any, silent: boolean) {
        const { pos } = state;
        if (state.src.slice(pos, pos + 2) !== '>!') return false;
        const end = state.src.indexOf('!<', pos + 2);
        if (end === -1) return false;
        if (!silent) {
            const token = state.push('spoiler', 'spoiler', 0);
            token.content = state.src.slice(pos + 2, end);
        }
        // eslint-disable-next-line no-param-reassign
        state.pos = end + 2;
        return true;
    }
    md.inline.ruler.before('text', 'redditSpoiler', tokenize);
}

// ---------------------
// Postprocessor to handle spoilers embedded within larger text tokens
// ---------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function spoilerPostProcessor(state: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state.tokens.forEach((token: any) => {
        if (token.type === 'inline' && token.children) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const newChildren: any[] = [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            token.children.forEach((child: any) => {
                // Only process text tokens that include our spoiler delimiters.
                if (child.type === 'text' && child.content.includes('||')) {
                    const text = child.content;
                    let lastIndex = 0;
                    const regex = /\|\|(.+?)\|\|/g;
                    let match;
                    // eslint-disable-next-line no-cond-assign
                    while ((match = regex.exec(text)) !== null) {
                        // Push any text before the spoiler as a text token.
                        if (match.index > lastIndex) {
                            const t = new state.Token('text', '', 0);
                            t.content = text.slice(lastIndex, match.index);
                            newChildren.push(t);
                        }
                        // Create a spoiler token for the matched content.
                        const spoilerToken = new state.Token(
                            'spoiler',
                            'spoiler',
                            0
                        );
                        // eslint-disable-next-line prefer-destructuring
                        spoilerToken.content = match[1];
                        newChildren.push(spoilerToken);
                        lastIndex = regex.lastIndex;
                    }
                    // If there's text after the last spoiler, add it as well.
                    if (lastIndex < text.length) {
                        const t = new state.Token('text', '', 0);
                        t.content = text.slice(lastIndex);
                        newChildren.push(t);
                    }
                } else {
                    newChildren.push(child);
                }
            });
            // eslint-disable-next-line no-param-reassign
            token.children = newChildren;
        }
    });
}

// ---------------------
// Custom Renderer for Spoiler Tokens in Markdown-It
// ---------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function spoilerRenderer(tokens: any, idx: number) {
    return `<spoiler>${tokens[idx].content}</spoiler>`;
}

// ---------------------
// Create Markdown-It Instance with Plugins and Linkify enabled
// ---------------------
const mdInstance = new MarkdownIt({
    typographer: true,
    html: true,
    linkify: true,
});
mdInstance.use(inlineSpoilerPlugin);
mdInstance.use(redditSpoilerPlugin);
mdInstance.renderer.rules.spoiler = spoilerRenderer;
// Register the postprocessor to catch inline spoilers embedded in larger text.
mdInstance.core.ruler.after(
    'inline',
    'spoiler_postprocessor',
    spoilerPostProcessor
);

// ---------------------
// Custom Renderers for react-native-render-html
// ---------------------
const customRenderers = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    spoiler: ({ tnode }: any) => {
        const content =
            tnode.domNode?.textContent || extractTextFromTnode(tnode) || '';
        return <InlineSpoiler>{content}</InlineSpoiler>;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    a: ({ tnode }: any) => <InlineLink tnode={tnode} />,
};

// ---------------------
// Custom Element Models for react-native-render-html
// ---------------------
const customHTMLElementModels = {
    ...defaultHTMLElementModels,
    spoiler: {
        ...defaultHTMLElementModels.span,
        contentModel: HTMLContentModel.textual,
        isTranslatableTextual: () => true,
    },
    a: {
        ...defaultHTMLElementModels.a,
        contentModel: HTMLContentModel.textual,
        isTranslatableTextual: () => true,
    },
};

// ---------------------
// Constants for preview mode
// ---------------------
const PREVIEW_MAX_HEIGHT = 200;
const ELLIPSIS_HEIGHT = 30;

// ---------------------
// Main MarkdownRenderer Component with Preview Prop (boolean)
// ---------------------
export const MarkdownRenderer: React.FC<{
    text: string;
    preview?: boolean;
}> = ({ text, preview }) => {
    const contentWidth = Dimensions.get('window').width;

    const [contentHeight, setContentHeight] = React.useState(0);
    const [expanded, setExpanded] = React.useState(false);
    const htmlContent = useMemo(
        () => `<div>${mdInstance.render(text)}</div>`,
        [text]
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleOnLayout = useCallback((event: any) => {
        setContentHeight(event.nativeEvent.layout.height);
    }, []);

    const baseStyle = useMemo(() => ({ marginTop: 0, paddingTop: 0 }), []);
    const tagsStyles = useMemo(
        () => ({
            div: styles.document,
            code: styles.code_inline,
            blockquote: styles.blockquote,
            h1: styles.heading1,
        }),
        []
    );
    const defaultTextProps = useMemo(() => ({ selectable: true }), []);

    const fullContent = (
        <View onLayout={handleOnLayout}>
            <RenderHTML
                contentWidth={contentWidth}
                source={{ html: htmlContent }}
                renderers={customRenderers}
                // @ts-expect-error render html
                customHTMLElementModels={customHTMLElementModels}
                baseStyle={baseStyle}
                tagsStyles={tagsStyles}
                defaultTextProps={defaultTextProps}
            />
        </View>
    );

    if (isOnlyEmojis(text)) {
        return (
            <View>
                <Text style={styles.emojiLarge}>{text.trim()}</Text>
            </View>
        );
    }

    if (!preview || expanded) {
        return <View>{fullContent}</View>;
    }

    const isTruncated = contentHeight > PREVIEW_MAX_HEIGHT;

    if (!isTruncated) {
        return <View>{fullContent}</View>;
    }

    return (
        <View style={{ height: PREVIEW_MAX_HEIGHT }}>
            <View
                style={{
                    height: PREVIEW_MAX_HEIGHT - ELLIPSIS_HEIGHT,
                    overflow: 'hidden',
                }}
            >
                <RenderHTML
                    contentWidth={contentWidth}
                    source={{ html: htmlContent }}
                    renderers={customRenderers}
                    // @ts-expect-error render html
                    customHTMLElementModels={customHTMLElementModels}
                    baseStyle={{ marginTop: 0, paddingTop: 0 }}
                    tagsStyles={{
                        div: styles.document,
                        code: styles.code_inline,
                        blockquote: styles.blockquote,
                        h1: styles.heading1,
                    }}
                    defaultTextProps={{ selectable: true }}
                />
            </View>
            <TouchableOpacity
                style={{
                    height: ELLIPSIS_HEIGHT,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
                onPress={() => setExpanded(true)}
            >
                <Text style={styles.ellipsisText}>...</Text>
            </TouchableOpacity>
        </View>
    );
};
