import React, { useMemo, useCallback } from 'react';
import {
    Text,
    StyleSheet,
    Dimensions,
    ScrollView,
    Linking,
    View,
    TouchableOpacity,
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
});

// ---------------------
// Helper function to extract text recursively from tnode children
// ---------------------
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
// Inline Spoiler Component (updated to be inline and not full width)
// ---------------------
const InlineSpoiler: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [revealed, setRevealed] = React.useState(false);
    return (
        <Text
            onPress={() => setRevealed((prev) => !prev)}
            selectable={true}
            style={[
                styles.spoilerText,
                {
                    backgroundColor: revealed ? 'transparent' : COLORS.White,
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
    if (!href.match(/^https?:\/\//)) {
        href = 'http://' + href;
    }
    const content =
        tnode.domNode?.textContent || extractTextFromTnode(tnode) || '';
    return (
        <Text
            onPress={() => {
                if (href) {
                    Linking.openURL(href);
                }
            }}
            selectable={true}
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
    function tokenize(state: any, silent: boolean) {
        const pos = state.pos;
        if (state.src.slice(pos, pos + 2) !== '||') return false;
        const end = state.src.indexOf('||', pos + 2);
        if (end === -1) return false;
        if (!silent) {
            const token = state.push('spoiler', 'spoiler', 0);
            token.content = state.src.slice(pos + 2, end);
        }
        state.pos = end + 2;
        return true;
    }
    md.inline.ruler.before('text', 'spoiler', tokenize);
}

// ---------------------
// Markdown-It Plugin for Reddit-Style Inline Spoilers (using >!spoiler!<)
// ---------------------
function redditSpoilerPlugin(md: MarkdownIt) {
    function tokenize(state: any, silent: boolean) {
        const pos = state.pos;
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

// ---------------------
// Custom Renderer for Spoiler Tokens in Markdown-It
// ---------------------
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

// ---------------------
// Custom Renderers for react-native-render-html
// ---------------------
const customRenderers = {
    spoiler: ({ tnode }: any) => {
        const content =
            tnode.domNode?.textContent || extractTextFromTnode(tnode) || '';
        return <InlineSpoiler>{content}</InlineSpoiler>;
    },
    a: ({ tnode }: any) => {
        return <InlineLink tnode={tnode} />;
    },
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
    const [contentHeight, setContentHeight] = React.useState(0);
    const [expanded, setExpanded] = React.useState(false);
    const htmlContent = useMemo(
        () => `<div>${mdInstance.render(text)}</div>`,
        [text]
    );
    const contentWidth = Dimensions.get('window').width;

    const handleOnLayout = useCallback(
        (event: any) => {
            setContentHeight(event.nativeEvent.layout.height);
        },
        [setContentHeight]
    );

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

    // Full content element used for measuring height
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

    // If not in preview mode or if expanded, render full content in a ScrollView.
    if (!preview || expanded) {
        return <ScrollView>{fullContent}</ScrollView>;
    }

    // Determine if the content is truncated (i.e. its height exceeds the preview max)
    const isTruncated = contentHeight > PREVIEW_MAX_HEIGHT;

    // If preview mode is active but content is short enough, render it normally.
    if (!isTruncated) {
        return <View>{fullContent}</View>;
    }

    // If content is truncated in preview mode, render a fixed-height container.
    // The container is split into:
    // 1. A content area (clipped to PREVIEW_MAX_HEIGHT - ELLIPSIS_HEIGHT).
    // 2. An inline ellipsis footer at the bottom that is clickable.
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
