// ContentEditor.tsx
import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { MarkdownEditor } from './MarkdownEditor';
import { RichTextEditor } from '../sections/RichTextEditor';
import { useTheme, Theme } from '../theme';
import { Tooltip } from './Tooltip';
import { FormattingOptions } from '../icons';
import { NexusButton } from '../buttons';

export type RichTextAndMarkdownEditorProps = {
    value: string;
    onChange: (text: string) => void;
    placeholder: string;
    errorMessage?: string;
    isExpanded?: boolean;
    onExpand?: () => void;
    editorBackgroundColor?: string;
    showFormattingToggle?: boolean;
    updateContent?: number;
};

export const RichTextAndMarkdownEditor: React.FC<
    RichTextAndMarkdownEditorProps
> = ({
    value,
    onChange,
    placeholder,
    errorMessage,
    isExpanded = true,
    onExpand,
    editorBackgroundColor: editorBackgroundColorProp,
    showFormattingToggle = false,
    updateContent,
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const editorBackgroundColor =
        editorBackgroundColorProp ?? theme.colors.PrimaryBackground;

    const [useMarkdown, setUseMarkdown] = useState(false);
    const [showFormattingOptions, setShowFormattingOptions] = useState(false);

    const renderExpandedEditor = () => (
        <>
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
            <View style={styles.editorContainer}>
                {useMarkdown ? (
                    <MarkdownEditor
                        placeholder={placeholder}
                        value={value}
                        onChangeText={onChange}
                        height="150px"
                        backgroundColor={editorBackgroundColor}
                    />
                ) : (
                    <RichTextEditor
                        placeholder={placeholder}
                        initialContent={value}
                        onChange={onChange}
                        height="150px"
                        backgroundColor={editorBackgroundColor}
                        {...(updateContent !== undefined
                            ? { updateContent }
                            : {})}
                        {...(showFormattingToggle
                            ? { showToolbar: showFormattingOptions }
                            : {})}
                    />
                )}
            </View>
            <View style={styles.formatAndAttachContainer}>
                {!useMarkdown && showFormattingToggle && (
                    <Tooltip
                        text={
                            showFormattingOptions
                                ? 'Hide formatting options'
                                : 'Show formatting options'
                        }
                    >
                        <Pressable
                            style={[
                                styles.formatToggleButton,
                                {
                                    backgroundColor: showFormattingOptions
                                        ? theme.colors.Primary
                                        : 'transparent',
                                },
                            ]}
                            onPress={() =>
                                setShowFormattingOptions((prev) => !prev)
                            }
                        >
                            <FormattingOptions
                                size={18}
                                color={theme.colors.ActiveText}
                            />
                        </Pressable>
                    </Tooltip>
                )}
            </View>
            {errorMessage ? (
                <Text style={styles.errorMessage}>{errorMessage}</Text>
            ) : undefined}
        </>
    );

    const renderCollapsedEditor = () => (
        <>
            {useMarkdown ? (
                <MarkdownEditor
                    placeholder={placeholder}
                    value={value}
                    onChangeText={onChange}
                    height="40px"
                    editable
                    onFocus={onExpand}
                    backgroundColor={editorBackgroundColor}
                />
            ) : (
                <RichTextEditor
                    placeholder={placeholder}
                    initialContent={value}
                    onChange={onChange}
                    showToolbar={false}
                    showScrollbars={false}
                    height="40px"
                    onFocus={onExpand}
                    backgroundColor={editorBackgroundColor}
                />
            )}
        </>
    );

    return (
        <View style={styles.container}>
            {isExpanded ? renderExpandedEditor() : renderCollapsedEditor()}
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
        formatAndAttachContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10,
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
