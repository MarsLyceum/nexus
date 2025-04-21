// ContentEditor.tsx
import React, { useState, useRef, useMemo } from 'react';
import {
    View,
    Text,
    Pressable,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

import { NexusImage } from './NexusImage';
import { MarkdownEditor } from './MarkdownEditor';
import { RichTextEditor, AttachmentPreviews } from '../sections';
import { Attachment } from '../types';
import { useFileUpload } from '../hooks';
import { GiphyModal } from './GiphyModal';
import { useTheme, Theme } from '../theme';
import { Tooltip } from './Tooltip';
import { FormattingOptions } from '../icons/FormattingOptions';

// --- New imports for preview modal ---
import { CustomPortalModal } from './CustomPortalModal';

export type ContentEditorProps = {
    value: string;
    onChange: (text: string) => void;
    placeholder: string;
    attachments: Attachment[];
    setAttachments: (attachments: Attachment[]) => void;
    errorMessage?: string;
    onSubmit: () => void;
    onCancel?: () => void;
    submitButtonText?: string;
    isExpanded?: boolean;
    onExpand?: () => void;
    editorBackgroundColor?: string;
    giphyVariant?: 'uri' | 'download';
    onGifSelect?: (attachment: Attachment) => void;
    showFormattingToggle?: boolean;
    updateContent?: number;
};

export const ContentEditor: React.FC<ContentEditorProps> = ({
    value,
    onChange,
    placeholder,
    attachments,
    setAttachments,
    errorMessage,
    onSubmit,
    onCancel,
    submitButtonText,
    isExpanded = true,
    onExpand,
    editorBackgroundColor: editorBackgroundColorProp,
    giphyVariant = 'uri',
    onGifSelect,
    showFormattingToggle = false,
    updateContent,
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const editorBackgroundColor =
        editorBackgroundColorProp ?? theme.colors.PrimaryBackground;

    const { pickFile } = useFileUpload();
    const [useMarkdown, setUseMarkdown] = useState(false);
    const [showGiphy, setShowGiphy] = useState(false);
    const [gifButtonLayout, setGifButtonLayout] = useState<
        { x: number; y: number; width: number; height: number } | undefined
    >(undefined);
    const gifButtonRef = useRef<View>(null);
    const [showFormattingOptions, setShowFormattingOptions] = useState(false);

    // --- New state for attachment preview ---
    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    const [selectedAttachment, setSelectedAttachment] = useState<
        Attachment | undefined
    >();

    // New state to hold the parent's dimensions
    const [previewParentSize, setPreviewParentSize] = useState({
        width: 0,
        height: 0,
    });

    const handleAttachmentInsert = async () => {
        try {
            const result = await pickFile();
            if (!result) return;
            const file = result;
            let previewUri = '';
            if (file && 'uri' in file) {
                previewUri = file.uri;
            } else if (file) {
                previewUri = URL.createObjectURL(file);
            }
            const newAttachment: Attachment = {
                id: `${Date.now()}-${Math.random()}`,
                file,
                previewUri,
            };
            // @ts-expect-error attachment
            setAttachments((prev) => [...prev, newAttachment]);
        } catch (error) {
            console.error('Error in handleAttachmentInsert:', error);
        }
    };

    const handleGifPress = () => {
        if (gifButtonRef.current) {
            gifButtonRef.current.measure(
                (x, y, width, height, pageX, pageY) => {
                    setGifButtonLayout({ x: pageX, y: pageY, width, height });
                    setShowGiphy(true);
                }
            );
        } else {
            setShowGiphy(true);
        }
    };

    const onRemoveAttachment = (attachmentId: string) => {
        // @ts-expect-error attachment
        setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
    };

    const renderExpandedEditor = () => (
        <>
            <Pressable
                onPress={() => setUseMarkdown((prev) => !prev)}
                style={styles.toggleButton}
            >
                <Text style={styles.toggleButtonText}>
                    {useMarkdown
                        ? 'Switch to Rich Text Editor'
                        : 'Switch to Markdown Editor'}
                </Text>
            </Pressable>
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
                <TouchableOpacity
                    onPress={handleAttachmentInsert}
                    style={styles.imageButton}
                >
                    <Icon name="image" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                    ref={gifButtonRef}
                    onPress={handleGifPress}
                    style={styles.gifButton}
                >
                    <Text style={styles.gifButtonText}>GIF</Text>
                </TouchableOpacity>
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
            {/* --- Updated: Pass onAttachmentPress to AttachmentPreviews --- */}
            <AttachmentPreviews
                attachments={attachments}
                onAttachmentPress={(attachment: Attachment) => {
                    setSelectedAttachment(attachment);
                    setPreviewModalVisible(true);
                }}
                onRemoveAttachment={onRemoveAttachment}
                onAttachmentsReorder={setAttachments}
            />
            {errorMessage ? (
                <Text style={styles.errorMessage}>{errorMessage}</Text>
            ) : undefined}
            <View style={styles.buttonRow}>
                {onCancel && (
                    <Pressable style={styles.cancelButton} onPress={onCancel}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>
                )}
                <Pressable style={styles.submitButton} onPress={onSubmit}>
                    <Text style={styles.submitButtonText}>
                        {submitButtonText || 'Submit'}
                    </Text>
                </Pressable>
            </View>
            <GiphyModal
                variant={giphyVariant}
                visible={showGiphy}
                onClose={() => setShowGiphy(false)}
                anchorPosition={gifButtonLayout || undefined}
                onSelectGif={(attachment) => {
                    if (onGifSelect) {
                        onGifSelect(attachment);
                    } else {
                        // @ts-expect-error attachment
                        onChange(attachment.file.uri);
                    }
                    setShowGiphy(false);
                }}
            />
            {/* --- New: Render the attachment preview modal with dynamic sizing based on the parent container --- */}
            {previewModalVisible && selectedAttachment && (
                <CustomPortalModal
                    visible={previewModalVisible}
                    onClose={() => setPreviewModalVisible(false)}
                >
                    <TouchableOpacity
                        style={styles.previewModalOverlay}
                        onPress={() => setPreviewModalVisible(false)}
                        onLayout={(e) => {
                            const { width, height } = e.nativeEvent.layout;
                            setPreviewParentSize({ width, height });
                        }}
                    >
                        <NexusImage
                            source={selectedAttachment.previewUri}
                            style={styles.previewModalImage}
                            width={previewParentSize.width * 0.9}
                            height={previewParentSize.height * 0.9}
                            alt="attachment"
                            contentFit="contain"
                        />
                    </TouchableOpacity>
                </CustomPortalModal>
            )}
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
            marginBottom: 8,
            paddingVertical: 4,
            paddingHorizontal: 8,
            borderRadius: 4,
            backgroundColor: theme.colors.Primary,
        },
        toggleButtonText: {
            color: theme.colors.ActiveText,
            fontWeight: '600',
        },
        editorContainer: {
            marginBottom: 10,
        },
        formatAndAttachContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10,
        },
        imageButton: {
            marginLeft: 10,
            padding: 8,
            backgroundColor: theme.colors.SecondaryBackground,
            borderRadius: 5,
            justifyContent: 'center',
            alignItems: 'center',
        },
        gifButton: {
            marginLeft: 10,
            padding: 8,
            backgroundColor: theme.colors.SecondaryBackground,
            borderRadius: 5,
            justifyContent: 'center',
            alignItems: 'center',
        },
        gifButtonText: {
            color: theme.colors.ActiveText,
            fontSize: 16,
            fontWeight: 'bold',
        },
        formatToggleButton: {
            marginLeft: 10,
            padding: 8,
            borderRadius: 5,
            justifyContent: 'center',
            alignItems: 'center',
        },
        buttonRow: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            marginTop: 5,
        },
        cancelButton: {
            marginRight: 10,
            paddingVertical: 8,
            paddingHorizontal: 15,
            borderRadius: 5,
            backgroundColor: theme.colors.ActiveText,
            borderWidth: 1,
            borderColor: theme.colors.Primary,
        },
        cancelButtonText: {
            color: theme.colors.Primary,
            fontWeight: '600',
        },
        submitButton: {
            paddingVertical: 8,
            paddingHorizontal: 15,
            borderRadius: 5,
            backgroundColor: theme.colors.Primary,
        },
        submitButtonText: {
            color: theme.colors.ActiveText,
            fontWeight: '600',
        },
        errorMessage: {
            color: theme.colors.Error,
            marginBottom: 5,
            textAlign: 'center',
        },
        // --- New styles for preview modal ---
        previewModalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.9)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        previewModalImage: {
            borderWidth: 2,
            borderColor: 'white',
        },
    });
}
