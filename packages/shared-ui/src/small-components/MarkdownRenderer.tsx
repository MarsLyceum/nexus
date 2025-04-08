import React, { useMemo, useCallback } from 'react';
import {
    Text,
    StyleSheet,
    Dimensions,
    Linking,
    View,
    TouchableOpacity,
    Platform,
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
    // Use white for paragraph text as desired.
    document: {
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
        fontFamily: 'Roboto_400Regular',
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
        color: COLORS.White,
        fontSize: 18,
    },
    emojiLarge: {
        fontSize: 64,
        textAlign: 'left',
        fontFamily: 'Roboto_400Regular',
    },
    // The edited tag should be smaller and styled (using a lighter gray per your palette).
    editedTag: {
        fontSize: 12,
        color: COLORS.InactiveText, // e.g., "#989898"
        fontFamily: 'Roboto_400Regular',
    },
});

// ---------------------
// Helpers
// ---------------------
const extractTextFromTnode = (tnode: any): string => {
    if (tnode.data) return tnode.data;
    if (tnode.children && Array.isArray(tnode.children)) {
        return tnode.children
            .map((el: unknown) => extractTextFromTnode(el))
            .join('');
    }
    return '';
};

const isOnlyEmojis = (text: string): boolean => {
    const emojiRegex =
        /^(?:\s*(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s*)+$/u;
    return emojiRegex.test(text.trim());
};

// ---------------------
// Inline Spoiler Component
// ---------------------
const InlineSpoiler: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [revealed, setRevealed] = React.useState(false);
    return (
        <Text
            onPress={() => setRevealed((prev) => !prev)}
            selectable={revealed}
            style={[
                styles.spoilerText,
                {
                    backgroundColor: revealed
                        ? COLORS.AppBackground
                        : COLORS.White,
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
const InlineLink: React.FC<{ tnode: any }> = ({ tnode }) => {
    let href = tnode.attributes?.href || '';
    if (!/^https?:\/\//.test(href)) {
        href = `http://${href}`;
    }
    const content =
        tnode.domNode?.textContent || extractTextFromTnode(tnode) || '';
    if (Platform.OS === 'web') {
        const webStyle = {
            color: styles.linkText.color,
            textDecoration: styles.linkText.textDecorationLine,
            fontSize: styles.linkText.fontSize,
            fontFamily: styles.linkText.fontFamily,
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
    return (
        <Text
            onPress={() => {
                if (href) void Linking.openURL(href);
            }}
            selectable
            style={[styles.linkText, { alignSelf: 'flex-start' }]}
        >
            {content}
        </Text>
    );
};

// ---------------------
// Markdown-It Setup
// ---------------------
const mdInstance = new MarkdownIt({
    breaks: true, // Convert single newlines to <br>
    linkify: true,
    typographer: true,
    html: true,
});

// (Keep paragraph tags intact so content is rendered as blocks.)

// Spoiler plugins
function inlineSpoilerPlugin(md: MarkdownIt) {
    function tokenize(state: any, silent: boolean) {
        const startPos = state.pos;
        if (state.src.slice(startPos, startPos + 2) !== '||') return false;
        const end = state.src.indexOf('||', startPos + 2);
        if (end === -1) return false;
        if (!silent) {
            const token = state.push('spoiler', 'spoiler', 0);
            token.content = state.src.slice(startPos + 2, end);
        }
        state.pos = end + 2;
        return true;
    }
    md.inline.ruler.before('text', 'spoiler', tokenize);
}
function redditSpoilerPlugin(md: MarkdownIt) {
    function tokenize(state: any, silent: boolean) {
        const { pos } = state;
        if (state.src.slice(pos, pos + 2) !== '>!') return false;
        const end = state.src.indexOf('!<', pos + 2);
        if (end === -1) return false;
        if (!silent) {
            const token = state.push('spoiler', 'spoiler', 0);
            token.content = state.src.slice(pos + 2, end);
        }
        state.pos = end + 2;
        return true;
    }
    md.inline.ruler.before('text', 'redditSpoiler', tokenize);
}
function spoilerPostProcessor(state: any) {
    state.tokens.forEach((token: any) => {
        if (token.type === 'inline' && token.children) {
            const newChildren: any[] = [];
            token.children.forEach((child: any) => {
                if (child.type === 'text' && child.content.includes('||')) {
                    const text = child.content;
                    let lastIndex = 0;
                    const regex = /\|\|(.+?)\|\|/g;
                    let match;
                    while ((match = regex.exec(text)) !== null) {
                        if (match.index > lastIndex) {
                            const t = new state.Token('text', '', 0);
                            t.content = text.slice(lastIndex, match.index);
                            newChildren.push(t);
                        }
                        const spoilerToken = new state.Token(
                            'spoiler',
                            'spoiler',
                            0
                        );
                        spoilerToken.content = match[1];
                        newChildren.push(spoilerToken);
                        lastIndex = regex.lastIndex;
                    }
                    if (lastIndex < text.length) {
                        const t = new state.Token('text', '', 0);
                        t.content = text.slice(lastIndex);
                        newChildren.push(t);
                    }
                } else {
                    newChildren.push(child);
                }
            });
            token.children = newChildren;
        }
    });
}
function spoilerRenderer(tokens: any, idx: number) {
    return `<span class="spoiler">${tokens[idx].content}</span>`;
}
mdInstance.use(inlineSpoilerPlugin);
mdInstance.use(redditSpoilerPlugin);
mdInstance.renderer.rules.spoiler = spoilerRenderer;
mdInstance.core.ruler.after(
    'inline',
    'spoiler_postprocessor',
    spoilerPostProcessor
);

// ---------------------
// Custom <span> Renderer
// ---------------------
const customSpanRenderer = ({ tnode }: any) => {
    if (!tnode) return null;
    const className = tnode.attributes?.class || '';
    const content =
        tnode.domNode?.textContent || extractTextFromTnode(tnode) || '';
    const classes = new Set(className.split(' ').map((cls: string) => cls.trim()));
    if (classes.has('spoiler')) {
        return <InlineSpoiler>{content}</InlineSpoiler>;
    }
    if (classes.has('edited')) {
        return <Text style={styles.editedTag}>{content}</Text>;
    }
    // Fallback: return a default Text element with inherited style.
    return <Text>{content}</Text>;
};

const customRenderers = {
    a: ({ tnode }: any) => <InlineLink tnode={tnode} />,
    span: customSpanRenderer,
};

const customHTMLElementModels = {
    ...defaultHTMLElementModels,
};

// ---------------------
// Constants for preview mode
// ---------------------
const PREVIEW_MAX_HEIGHT = 200;
const ELLIPSIS_HEIGHT = 30;

// ---------------------
// Main MarkdownRenderer Component
// ---------------------
export const MarkdownRenderer: React.FC<{
    text: string;
    preview?: boolean;
    isEdited?: boolean;
}> = ({ text, preview, isEdited }) => {
    const contentWidth = Dimensions.get('window').width;
    const [contentHeight, setContentHeight] = React.useState(0);
    const [expanded, setExpanded] = React.useState(false);

    // Convert Markdown to HTML.
    // If isEdited is true, insert the edited tag inline at the end of the last paragraph.
    const finalHtmlContent = useMemo(() => {
        let rendered = mdInstance.render(text).trim();
        if (isEdited) {
            if (rendered.includes('</p>')) {
                // Replace the last occurrence of </p> with the edited tag before it.
                rendered = rendered.replace(
                    /<\/p>(?!.*<\/p>)/,
                    ' <span class="edited">(edited)</span></p>'
                );
            } else {
                rendered += ' <span class="edited">(edited)</span>';
            }
        }
        return `<div>${rendered}</div>`;
    }, [text, isEdited]);

    const htmlContent = useMemo(() => finalHtmlContent, [finalHtmlContent]);

    const handleOnLayout = useCallback((event: any) => {
        setContentHeight(event.nativeEvent.layout.height);
    }, []);

    // Define tagsStyles to include paragraph styling.
    const tagsStyles = useMemo(
        () => ({
            div: styles.document,
            p: {
                color: COLORS.White, // Ensure paragraphs render with white text
                fontSize: 16,
                lineHeight: 22,
                fontFamily: 'Roboto_400Regular',
                marginVertical: 4,
            },
            code: styles.code_inline,
            blockquote: styles.blockquote,
            h1: styles.heading1,
        }),
        []
    );
    const baseStyle = useMemo(() => ({ marginTop: 0, paddingTop: 0 }), []);
    const defaultTextProps = useMemo(() => ({ selectable: true }), []);

    const fullContent = (
        <View onLayout={handleOnLayout}>
            <RenderHTML
                contentWidth={contentWidth}
                source={{ html: htmlContent }}
                renderers={customRenderers}
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
                    customHTMLElementModels={customHTMLElementModels}
                    baseStyle={{ marginTop: 0, paddingTop: 0 }}
                    tagsStyles={tagsStyles}
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
