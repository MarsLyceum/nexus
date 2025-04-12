import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StyleProp,
    TextStyle,
    StyleSheet as RNStyleSheet,
} from 'react-native';

import { extractUrls } from '../../utils';
import { useTheme, Theme } from '../../theme';

import { MarkdownEditor } from '../MarkdownEditor';
import { MarkdownRenderer } from '../MarkdownRenderer';

export type MessageEditorProps = {
    initialContent: string;
    width: number;
    onChange: (newContent: string) => void;
    onSave: () => void;
    onCancel: () => void;
};

export const MessageEditor: React.FC<MessageEditorProps> = ({
    initialContent,
    width,
    onChange,
    onSave,
    onCancel,
}) => {
    const [editedContent, setEditedContent] = useState(initialContent);
    const [editorHeight, setEditorHeight] = useState<number>(60);
    const [avgCharWidth, setAvgCharWidth] = useState<number | undefined>();
    const [measuredLineHeight, setMeasuredLineHeight] = useState<
        number | undefined
    >();
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const isOnlyUrl =
        extractUrls(editedContent).length === 1 &&
        editedContent.trim() === extractUrls(editedContent)[0];

    // Estimate height using measured text metrics and style-based padding.
    const estimateHeightForUrl = (
        text: string,
        containerWidth: number,
        avgCharWidthInner: number,
        lineHeight: number,
        horizontalPadding: number,
        verticalPadding: number
    ): number => {
        if (!text.trim()) {
            return 60;
        }

        const effectiveWidth = containerWidth - horizontalPadding;
        const charsPerLine =
            Math.floor(effectiveWidth / avgCharWidthInner) || 1;
        const lines = Math.ceil(text.length / charsPerLine);
        return lines * lineHeight + verticalPadding;
    };

    // For URL-only messages, update the editor height based on measured text style.
    useEffect(() => {
        // For empty content, always use default height
        if (!editedContent.trim()) {
            setEditorHeight(60);
            return;
        }

        // For URL content with measurements
        if (isOnlyUrl && avgCharWidth && measuredLineHeight) {
            const flattened: StyleProp<TextStyle> =
                RNStyleSheet.flatten(styles.urlText) || {};
            const horizontalPadding =
                flattened.paddingHorizontal ??
                (typeof flattened.padding === 'number'
                    ? flattened.padding * 2
                    : 0);
            const verticalPadding =
                flattened.paddingVertical ??
                (typeof flattened.padding === 'number'
                    ? flattened.padding * 2
                    : 0);
            const estimatedHeight = estimateHeightForUrl(
                editedContent,
                width,
                avgCharWidth,
                measuredLineHeight,
                horizontalPadding as number,
                verticalPadding as number
            );
            setEditorHeight(Math.max(60, estimatedHeight));
        }
    }, [editedContent, isOnlyUrl, width, avgCharWidth, measuredLineHeight]);

    // For non-URL messages, use a hidden MarkdownRenderer to update height.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleNonUrlLayout = (e: any) => {
        const { height } = e.nativeEvent.layout;
        setEditorHeight(Math.max(60, height));
    };

    // Existing key handler if the MarkdownEditor is focused.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleKeyDown = (e: any) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSave();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
        }
    };

    // Global key event listener to capture key events even when the editor isn't focused.
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSave();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onCancel();
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => {
            window.removeEventListener('keydown', handleGlobalKeyDown);
        };
    }, [onSave, onCancel]);

    return (
        <View style={styles.editContainer}>
            {/* Hidden measurement view for non-URL messages */}
            {!isOnlyUrl && (
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        opacity: 0,
                        width: '100%',
                    }}
                    onLayout={handleNonUrlLayout}
                >
                    <MarkdownRenderer text={editedContent} />
                </View>
            )}
            <MarkdownEditor
                value={editedContent}
                onChangeText={(text) => {
                    setEditedContent(text);
                    onChange(text);
                }}
                placeholder=""
                width="100%"
                height={`${Math.max(60, editorHeight)}px`}
                onKeyDown={handleKeyDown} // This remains for when the editor is focused.
            />
            <Text style={styles.instructionText}>
                escape to{' '}
                <Text style={styles.clickableText} onPress={onCancel}>
                    cancel
                </Text>{' '}
                • shift + enter for multiple lines • enter to{' '}
                <Text style={styles.clickableText} onPress={onSave}>
                    save
                </Text>
            </Text>

            {/* No link previews here anymore - they will be rendered by MessageItem */}

            {/* Hidden measurement element for URL-only messages */}
            {isOnlyUrl &&
                avgCharWidth === null &&
                measuredLineHeight === null && (
                    <Text
                        style={[
                            styles.urlText,
                            {
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                opacity: 0,
                            },
                        ]}
                        onLayout={(e) => {
                            const { layout } = e.nativeEvent;
                            setAvgCharWidth(layout.width);
                            setMeasuredLineHeight(layout.height);
                        }}
                    >
                        M
                    </Text>
                )}
        </View>
    );
};

function createStyles(theme: Theme) {
    return StyleSheet.create({
        editContainer: {
            marginTop: 5,
            position: 'relative',
            borderColor: theme.colors.SecondaryBackground,
            borderWidth: 1,
            borderRadius: 4,
            padding: 8,
            backgroundColor: theme.colors.TertiaryBackground,
        },
        instructionText: {
            marginTop: 4,
            fontSize: 12,
            color: theme.colors.InactiveText,
            fontStyle: 'italic',
        },
        clickableText: {
            color: theme.colors.Tertiary,
        },
        urlText: {
            fontSize: 14,
            color: theme.colors.ActiveText,
            fontFamily: 'Roboto_400Regular',
            padding: 4,
        },
    });
}
