import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StyleProp,
    TextStyle,
    StyleSheet as RNStyleSheet,
    LayoutChangeEvent,
} from 'react-native';

import { extractUrls } from '../utils';
import { NexusButton } from '../buttons';
import { useTheme, Theme } from '../theme';
import { useIsComputer } from '../hooks';

import { MarkdownEditor } from './MarkdownEditor';
import { MarkdownRenderer } from './MarkdownRenderer';

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
    // Determine platform-specific behavior.
    const isComputer = useIsComputer();

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

    useEffect(() => {
        if (!editedContent.trim()) {
            setEditorHeight(60);
            return;
        }
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
    }, [
        editedContent,
        isOnlyUrl,
        width,
        avgCharWidth,
        measuredLineHeight,
        styles.urlText,
    ]);

    // Use hidden MarkdownRenderer to calculate the content's height.
    const handleNonUrlLayout = (e: LayoutChangeEvent) => {
        const { height } = e.nativeEvent.layout;
        setEditorHeight(Math.max(60, height));
    };

    // Key handler when the editor is focused (desktop only).
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSave();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
        }
    };

    // Global key listener (desktop only).
    // eslint-disable-next-line consistent-return
    useEffect(() => {
        if (isComputer) {
            const handleGlobalKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onSave();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    onCancel();
                }
            };
            globalThis.addEventListener('keydown', handleGlobalKeyDown);
            return () => {
                globalThis.removeEventListener('keydown', handleGlobalKeyDown);
            };
        }
    }, [onSave, onCancel, isComputer]);

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
                onKeyDown={isComputer ? handleKeyDown : undefined}
            />
            <View style={mobileStyles.mobileButtonContainer}>
                <NexusButton
                    label="Cancel"
                    onPress={onCancel}
                    variant="outline"
                />
                <NexusButton label="Save" onPress={onSave} variant="filled" />
            </View>
            {isOnlyUrl &&
                avgCharWidth === undefined &&
                measuredLineHeight === undefined && (
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
            borderWidth: 2,
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

const mobileStyles = StyleSheet.create({
    mobileButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 8,
    },
});
