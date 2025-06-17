// RichTextAndMarkdownEditor.tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    NativeSyntheticEvent,
    TextInputContentSizeChangeEventData,
} from 'react-native';

import { MarkdownEditor } from './MarkdownEditor';
import { RichTextEditor } from '../sections/RichTextEditor';
import { useTheme, Theme } from '../theme';
import { FormattingOptions } from '../icons';
import { NexusButton } from '../buttons';

export type RichTextAndMarkdownEditorProps = {
    value: string;
    onChange: (text: string) => void;
    useRichTextEditor?: boolean;
    placeholder: string;
    errorMessage?: string;
    isExpanded?: boolean;
    onExpand?: () => void;
    editorBackgroundColor?: string;
    showFormattingToggle?: boolean;
    updateContent?: number;
    showToolbar?: boolean;
    height?: string;
    onContentSizeChange?: (
        e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>
    ) => void;
    expandedHeight?: number;
    collapsedHeight?: number;
};

export const RichTextAndMarkdownEditor: React.FC<
    RichTextAndMarkdownEditorProps
> = ({
    useRichTextEditor = false,
    value,
    onChange,
    placeholder,
    errorMessage,
    isExpanded = true,
    onExpand,
    editorBackgroundColor: editorBackgroundColorProp,
    showFormattingToggle = false,
    updateContent,
    height,
    onContentSizeChange,
    expandedHeight,
    collapsedHeight,
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const editorBackgroundColor =
        editorBackgroundColorProp ?? theme.colors.PrimaryBackground;

    const [useMarkdown, setUseMarkdown] = useState(!useRichTextEditor);
    const [showFormattingOptions, setShowFormattingOptions] = useState(false);
    const [measuredHeightIncludingToolbar, setMeasuredHeightIncludingToolbar] =
        useState<string>(height ?? `${collapsedHeight ?? 40}px`);

    useEffect(() => {
        if (showFormattingOptions && !useMarkdown && isExpanded && height) {
            const TOOLBAR_HEIGHT = showFormattingToggle ? 40 : 0;
            const parsedHeight = Number.parseInt(height, 10);
            setMeasuredHeightIncludingToolbar(
                `${TOOLBAR_HEIGHT + parsedHeight}px`
            );
        } else {
            setMeasuredHeightIncludingToolbar(
                height ?? `${collapsedHeight ?? 40}px`
            );
        }
    }, [
        height,
        isExpanded,
        showFormattingOptions,
        showFormattingToggle,
        useMarkdown,
    ]);

    const computedHeight = isExpanded
        ? expandedHeight
            ? `${expandedHeight}px`
            : measuredHeightIncludingToolbar
        : `${collapsedHeight ?? 40}px`;

    return (
        <View style={styles.container}>
            {isExpanded && (
                <View style={styles.formatContainer}>
                    {!useMarkdown && showFormattingToggle && (
                        <>
                            <NexusButton
                                style={styles.toggleButton}
                                label=""
                                onPress={() =>
                                    setShowFormattingOptions((prev) => !prev)
                                }
                                variant="text"
                                tooltipText={
                                    showFormattingOptions
                                        ? 'Hide formatting options'
                                        : 'Show formatting options'
                                }
                                wideButton={false}
                            >
                                <FormattingOptions
                                    size={18}
                                    color={
                                        showFormattingOptions
                                            ? theme.colors.Primary
                                            : theme.colors.ActiveText
                                    }
                                />
                            </NexusButton>
                        </>
                    )}
                    {useRichTextEditor && (
                        <NexusButton
                            style={styles.toggleButton}
                            label={
                                useMarkdown
                                    ? 'Switch to Rich Text Editor'
                                    : 'Switch to Markdown Editor'
                            }
                            onPress={() => setUseMarkdown((prev) => !prev)}
                            variant="text"
                        />
                    )}
                </View>
            )}

            <View style={styles.editorContainer}>
                {useMarkdown ? (
                    <MarkdownEditor
                        placeholder={placeholder}
                        value={value}
                        onChangeText={onChange}
                        height={computedHeight}
                        backgroundColor={editorBackgroundColor}
                        onContentSizeChange={onContentSizeChange}
                        {...(!isExpanded
                            ? { editable: true, onFocus: onExpand }
                            : {})}
                    />
                ) : (
                    <RichTextEditor
                        placeholder={placeholder}
                        initialContent={value}
                        onChange={onChange}
                        height={computedHeight}
                        backgroundColor={editorBackgroundColor}
                        onContentSizeChange={onContentSizeChange}
                        {...(isExpanded
                            ? {
                                  ...(updateContent !== undefined
                                      ? { updateContent }
                                      : {}),
                                  ...(showFormattingToggle
                                      ? {
                                            showToolbar: showFormattingOptions,
                                        }
                                      : {}),
                                  showScrollbars: true,
                              }
                            : {
                                  showToolbar: false,
                                  showScrollbars: false,
                                  onFocus: onExpand,
                              })}
                    />
                )}
            </View>

            {errorMessage ? (
                <Text style={styles.errorMessage}>{errorMessage}</Text>
            ) : undefined}
        </View>
    );
};

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            marginTop: 10,
            marginBottom: 10,
            borderWidth: 0,
            borderRadius: 5,
            padding: 10,
            position: 'relative',
        },
        toggleButton: {
            alignSelf: 'flex-end',
        },
        editorContainer: {
            marginBottom: 10,
        },
        formatContainer: {
            alignSelf: 'flex-end',
            flexDirection: 'row',
        },
        formatToggleButton: {
            marginLeft: 10,
            padding: 8,
            borderRadius: 5,
            justifyContent: 'center',
            alignItems: 'center',
        },
        errorMessage: {
            color: theme.colors.Error,
            marginBottom: 5,
            textAlign: 'center',
        },
    });
}
