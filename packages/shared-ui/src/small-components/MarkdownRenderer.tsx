import React, { useMemo, useCallback } from 'react';
import {
    Text,
    StyleSheet,
    Dimensions,
    Linking,
    View,
    TouchableOpacity,
    Platform,
    LayoutChangeEvent,
} from 'react-native';
import MarkdownIt from 'markdown-it';
import RenderHTML, { defaultHTMLElementModels } from 'react-native-render-html';

import { useTheme, Theme } from '../theme';
import { Spacing, Typography } from '../constants/designSystem';
import { toRgba } from '../utils';

function createStyles(theme: Theme) {
    return StyleSheet.create({
        document: {
            ...Typography.Body,
            fontFamily: theme.fonts.primary?.regular,
        },
        code_inline: {
            ...Typography.Code,
            fontFamily:
                theme.fonts.monospace?.regular ??
                Platform.select({
                    web: 'monospace',
                    default: 'Courier',
                }),
            backgroundColor: toRgba(theme.colors.AppBackground, 0.8),
            color: theme.colors.MainText,
            paddingHorizontal: Spacing.XS,
            paddingVertical: Spacing.XS / 2,
        },
        blockquote: {
            backgroundColor: theme.colors.AppBackground,
            padding: Spacing.MD,
            borderLeftColor: theme.colors.Primary,
            borderLeftWidth: 4,
            marginVertical: Spacing.SM,
        },
        spoilerText: {
            ...Typography.Body,
            fontFamily: theme.fonts.primary?.regular,
        },
        linkText: {
            ...Typography.Body,
            fontFamily: theme.fonts.primary?.regular,
            color: theme.colors.Link,
            textDecorationLine: 'underline',
        },
        heading1: {
            ...Typography.H1,
            fontFamily: theme.fonts.primary?.bold,
            marginTop: Spacing.SM,
            marginBottom: Spacing.SM,
            color: theme.colors.ActiveText,
        },
        ellipsisText: {
            ...Typography.SectionHeading,
            fontFamily: theme.fonts.primary?.semibold,
            color: theme.colors.ActiveText,
        },
        emojiLarge: {
            fontSize: 64,
            fontFamily: theme.fonts.primary?.regular,
            textAlign: 'left',
        },
        editedTag: {
            ...Typography.Caption,
            fontFamily: theme.fonts.secondary?.regular,
            color: theme.colors.InactiveText,
        },
    });
}

// ---------------------
// Helpers
// ---------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
const InlineSpoilerBase: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [revealed, setRevealed] = React.useState(false);
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const toggleRevealed = useCallback(() => {
        setRevealed((prev) => !prev);
    }, []);

    const spoilerStyle = useMemo(
        () => [
            styles.spoilerText,
            {
                backgroundColor: revealed
                    ? theme.colors.AppBackground
                    : theme.colors.ActiveText,
                color: theme.colors.ActiveText,
                alignSelf: 'flex-start' as const,
            },
        ],
        [
            styles.spoilerText,
            revealed,
            theme.colors.AppBackground,
            theme.colors.ActiveText,
        ]
    );

    return (
        <Text
            onPress={toggleRevealed}
            selectable={revealed}
            style={spoilerStyle}
        >
            {children}
        </Text>
    );
};
const InlineSpoiler = React.memo(InlineSpoilerBase);

// ---------------------
// Custom Inline Link Component
// ---------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const InlineLinkBase: React.FC<{ tnode: any }> = ({ tnode }) => {
    let href = tnode.attributes?.href || '';
    if (!/^https?:\/\//.test(href)) {
        href = `http://${href}`;
    }
    const content =
        tnode.domNode?.textContent || extractTextFromTnode(tnode) || '';

    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const webStyle = useMemo(
        () => ({
            color: styles.linkText.color,
            textDecoration: styles.linkText.textDecorationLine,
            fontSize: styles.linkText.fontSize,
            fontFamily: styles.linkText.fontFamily,
        }),
        [styles.linkText]
    );

    const handlePress = useCallback(() => {
        if (href) void Linking.openURL(href);
    }, [href]);

    const nativeStyle = useMemo(
        () => [styles.linkText, { alignSelf: 'flex-start' as const }],
        [styles.linkText]
    );

    if (Platform.OS === 'web') {
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
        <Text onPress={handlePress} selectable style={nativeStyle}>
            {content}
        </Text>
    );
};
const InlineLink = React.memo(InlineLinkBase);

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
    md.inline.ruler.before('text', 'spoiler', tokenize);
}
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function spoilerPostProcessor(state: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state.tokens.forEach((token: any) => {
        if (token.type === 'inline' && token.children) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const newChildren: any[] = [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            token.children.forEach((child: any) => {
                if (child.type === 'text' && child.content.includes('||')) {
                    const text = child.content;
                    let lastIndex = 0;
                    const regex = /\|\|(.+?)\|\|/g;
                    let match;
                    // eslint-disable-next-line no-cond-assign
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
                        // eslint-disable-next-line prefer-destructuring
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
            // eslint-disable-next-line no-param-reassign
            token.children = newChildren;
        }
    });
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
function MarkdownRendererComponent({
    text,
    preview,
    isEdited,
}: Readonly<{
    text: string;
    preview?: boolean;
    isEdited?: boolean;
}>) {
    const [contentHeight, setContentHeight] = React.useState(0);
    const hasMeasuredRef = React.useRef(false);
    const measuredContentRef = React.useRef<string | null>(null);
    const [expanded, setExpanded] = React.useState(false);
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const contentWidth = useMemo(() => Dimensions.get('window').width, []);

    // Convert Markdown to HTML.
    // If isEdited is true, insert the edited tag inline at the end of the last paragraph.
    const finalHtmlContent = useMemo(() => {
        const trimmedText = text.trim();
        const renderableText = trimmedText.length > 0 ? trimmedText : '&nbsp;';
        let rendered = mdInstance.render(renderableText).trim();
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

    const source = useMemo(() => ({ html: htmlContent }), [htmlContent]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shouldMeasureContent = preview === true && !expanded;

    React.useEffect(() => {
        if (!shouldMeasureContent) {
            if (hasMeasuredRef.current) {
                hasMeasuredRef.current = false;
            }
            if (measuredContentRef.current !== null) {
                measuredContentRef.current = null;
            }
            if (contentHeight !== 0) {
                setContentHeight(0);
            }
            return;
        }

        if (measuredContentRef.current !== finalHtmlContent) {
            measuredContentRef.current = finalHtmlContent;
            hasMeasuredRef.current = false;
            if (contentHeight !== 0) {
                setContentHeight(0);
            }
        }
    }, [contentHeight, finalHtmlContent, shouldMeasureContent]);

    const handleOnLayout = useCallback(
        (event: LayoutChangeEvent) => {
            if (!shouldMeasureContent) return;
            const nextHeight = event.nativeEvent.layout.height;
            const hasMeasured = hasMeasuredRef.current;
            if (!hasMeasured || Math.abs(nextHeight - contentHeight) > 0.5) {
                hasMeasuredRef.current = true;
                setContentHeight(nextHeight);
            }
        },
        [contentHeight, shouldMeasureContent]
    );

    // Define tagsStyles to include paragraph styling.
    const tagsStyles = useMemo(
        () => ({
            div: styles.document,
            p: {
                color: theme.colors.ActiveText, // Ensure paragraphs render with white text
                fontSize: 16,
                lineHeight: 22,
                fontFamily: 'Roboto_400Regular',
                marginVertical: 4,
            },
            code: styles.code_inline,
            blockquote: styles.blockquote,
            h1: styles.heading1,
        }),
        [styles, theme.colors.ActiveText]
    );
    const baseStyle = useMemo(() => ({ marginTop: 0, paddingTop: 0 }), []);
    const defaultTextProps = useMemo(() => ({ selectable: true }), []);

    const customLinkRenderer = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ tnode }: any) => <InlineLink tnode={tnode} />,
        []
    );

    const customSpanRenderer = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ tnode }: any) => {
            if (!tnode) return undefined;
            const className = tnode.attributes?.class || '';
            const content =
                tnode.domNode?.textContent || extractTextFromTnode(tnode) || '';
            const classes = new Set(
                className.split(' ').map((cls: string) => cls.trim())
            );
            if (classes.has('spoiler')) {
                return <InlineSpoiler>{content}</InlineSpoiler>;
            }
            if (classes.has('edited')) {
                return <Text style={styles.editedTag}>{content}</Text>;
            }
            // Fallback: return a default Text element with inherited style.
            return <Text>{content}</Text>;
        },
        [styles.editedTag]
    );

    const customRenderers = useMemo(
        () => ({
            a: customLinkRenderer,
            span: customSpanRenderer,
        }),
        [customLinkRenderer, customSpanRenderer]
    );

    const fullContent = (
        <View onLayout={handleOnLayout}>
            <RenderHTML
                contentWidth={contentWidth}
                source={source}
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
                    source={source}
                    renderers={customRenderers}
                    customHTMLElementModels={customHTMLElementModels}
                    baseStyle={baseStyle}
                    tagsStyles={tagsStyles}
                    defaultTextProps={defaultTextProps}
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
}

export const MarkdownRenderer = React.memo(MarkdownRendererComponent);
