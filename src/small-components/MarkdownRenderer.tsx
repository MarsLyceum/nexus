import React from 'react';
import {
    Text,
    StyleSheet,
    Dimensions,
    ScrollView,
    Linking,
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
// Main MarkdownRenderer Component
// ---------------------
export const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
    // Wrap the rendered markdown in a <div> to ensure proper container styling
    const htmlContent = `<div>${mdInstance.render(text)}</div>`;
    const contentWidth = Dimensions.get('window').width;

    return (
        <ScrollView>
            <RenderHTML
                contentWidth={contentWidth}
                source={{ html: htmlContent }}
                renderers={customRenderers}
                customHTMLElementModels={customHTMLElementModels}
                // Apply baseStyle to control the overall layout of the rendered content
                baseStyle={{ marginTop: 0, paddingTop: 0 }}
                tagsStyles={{
                    div: styles.document,
                    code: styles.code_inline,
                    blockquote: styles.blockquote,
                    h1: styles.heading1,
                }}
                defaultTextProps={{ selectable: true }}
            />
        </ScrollView>
    );
};
