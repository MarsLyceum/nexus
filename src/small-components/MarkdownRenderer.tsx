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
        // Optionally add additional padding if needed.
    },
    linkText: {
        color: COLORS.Link, // Updated to use COLORS.Link (#3254a8)
        textDecorationLine: 'underline',
        fontSize: 16,
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
        return tnode.children.map(extractTextFromTnode).join('');
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
                    alignSelf: 'flex-start', // Keeps the element inline
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
    // If href does not start with a protocol, prepend "http://"
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
            style={[
                styles.linkText,
                { alignSelf: 'flex-start' }, // Ensures the inline element only takes up necessary width
            ]}
        >
            {content}
        </Text>
    );
};

// ---------------------
// Markdown-It Plugin for Inline Spoilers
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
// Custom Renderer for Spoiler Tokens in Markdown-It
// ---------------------
function spoilerRenderer(tokens: any, idx: number) {
    return `<spoiler>${tokens[idx].content}</spoiler>`;
}

// ---------------------
// Create Markdown-It Instance with Plugin and Linkify enabled
// ---------------------
const mdInstance = new MarkdownIt({
    typographer: true,
    html: true,
    linkify: true, // Enables automatic linking of plain URLs like www.google.com
});
mdInstance.use(inlineSpoilerPlugin);
mdInstance.renderer.rules.spoiler = spoilerRenderer;

// ---------------------
// Custom Renderers for react-native-render-html
// ---------------------
const customRenderers = {
    spoiler: ({ tnode }: any) => {
        // Extract text content either from the domNode or by traversing children.
        const content =
            tnode.domNode?.textContent || extractTextFromTnode(tnode) || '';
        return <InlineSpoiler>{content}</InlineSpoiler>;
    },
    a: ({ tnode }: any) => {
        // Render the link as an inline element with our custom styling.
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
        contentModel: HTMLContentModel.textual, // Inline behavior
        isTranslatableTextual: () => true,
    },
    a: {
        ...defaultHTMLElementModels.a,
        contentModel: HTMLContentModel.textual, // Ensure inline behavior
        isTranslatableTextual: () => true,
    },
};

// ---------------------
// Main MarkdownRenderer Component
// ---------------------
export const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
    const htmlContent = mdInstance.render(text);
    const contentWidth = Dimensions.get('window').width;

    return (
        <ScrollView>
            <RenderHTML
                contentWidth={contentWidth}
                source={{ html: htmlContent }}
                renderers={customRenderers}
                customHTMLElementModels={customHTMLElementModels}
                tagsStyles={{
                    body: styles.document,
                    code: styles.code_inline,
                    blockquote: styles.blockquote,
                }}
                defaultTextProps={{ selectable: true }}
            />
        </ScrollView>
    );
};
