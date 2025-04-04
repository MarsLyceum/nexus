import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StyleProp,
    TextStyle,
    StyleSheet as RNStyleSheet,
} from 'react-native';
import { MarkdownEditor } from '../MarkdownEditor';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { LinkPreview } from '../LinkPreview';
import { extractUrls } from '../../utils';
import { COLORS } from '../../constants';

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
    const [avgCharWidth, setAvgCharWidth] = useState<number | null>(null);
    const [measuredLineHeight, setMeasuredLineHeight] = useState<number | null>(
        null
    );

    const editedUrls = extractUrls(editedContent);
    const isOnlyUrl =
        editedUrls.length === 1 && editedContent.trim() === editedUrls[0];

    // Estimate height using measured text metrics and style-based padding.
    const estimateHeightForUrl = (
        text: string,
        containerWidth: number,
        avgCharWidth: number,
        lineHeight: number,
        horizontalPadding: number,
        verticalPadding: number
    ): number => {
        const effectiveWidth = containerWidth - horizontalPadding;
        const charsPerLine = Math.floor(effectiveWidth / avgCharWidth) || 1;
        const lines = Math.ceil(text.length / charsPerLine);
        return lines * lineHeight + verticalPadding;
    };

    // For URL-only messages, update the editor height based on measured text style.
    useEffect(() => {
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
                horizontalPadding,
                verticalPadding
            );
            setEditorHeight(estimatedHeight);
        }
    }, [editedContent, isOnlyUrl, width, avgCharWidth, measuredLineHeight]);

    // For non-URL messages, use a hidden MarkdownRenderer to update height.
    const handleNonUrlLayout = (e: any) => {
        const { height } = e.nativeEvent.layout;
        setEditorHeight(height);
    };

    // Existing key handler if the MarkdownEditor is focused.
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
                placeholder="Edit your message..."
                width="100%"
                height={editorHeight}
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
            {editedUrls.length > 0 && (
                <View style={styles.linkPreviewContainer}>
                    {editedUrls.map((url, index) => (
                        <LinkPreview
                            key={index}
                            url={url}
                            containerWidth={width - 32}
                        />
                    ))}
                </View>
            )}
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
                            const layout = e.nativeEvent.layout;
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

const styles = StyleSheet.create({
    editContainer: {
        marginTop: 5,
        position: 'relative',
        borderColor: COLORS.SecondaryBackground,
        borderWidth: 1,
        borderRadius: 4,
        padding: 8,
        backgroundColor: COLORS.TertiaryBackground,
    },
    instructionText: {
        marginTop: 4,
        fontSize: 12,
        color: COLORS.InactiveText,
        fontStyle: 'italic',
    },
    clickableText: {
        color: COLORS.AccentText,
    },
    linkPreviewContainer: {
        marginTop: 10,
    },
    urlText: {
        fontSize: 14,
        color: COLORS.White,
        fontFamily: 'Roboto_400Regular',
        padding: 4,
    },
});
