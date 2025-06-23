// src/small-components/ContentEditor.tsx
import React, {
    useState,
    useEffect,
    useMemo,
    useRef,
    useCallback,
} from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

import { NexusButton } from '../buttons';
import { useTheme, Theme } from '../theme';
import { useFileUpload, useIsComputer } from '../hooks';

import { RichTextAndMarkdownEditor } from './RichTextAndMarkdownEditor';

import { GiphyModal } from './GiphyModal';
import { AttachmentPreviews } from '../sections/AttachmentPreviews';
import { NexusImage } from './NexusImage';
import { CustomPortalModal } from './CustomPortalModal';
import { Attachment } from '../types';

export type ContentEditorProps = {
    value: string;
    onChange: (text: string) => void;
    onSubmit?: () => void;
    onCancel?: () => void;
    useRichTextEditor?: boolean;
    showButtonsEditButtons?: boolean;

    placeholder?: string;
    attachments?: Attachment[];
    setAttachments?: (atts: Attachment[]) => void;
    errorMessage?: string;
    submitButtonText?: string;
    isExpanded?: boolean;
    onExpand?: () => void;
    editorBackgroundColor?: string;
    giphyVariant?: 'uri' | 'download';
    onGifSelect?: (att: Attachment) => void;
    showFormattingToggle?: boolean;
    updateContent?: number;
    showImageButton?: boolean;
    showGifButton?: boolean;
    height?: number;
    editMode?: boolean;
};

export const ContentEditor: React.FC<ContentEditorProps> = ({
    value,
    onChange,
    onSubmit = () => {},
    onCancel = () => {},
    useRichTextEditor = false,
    showButtonsEditButtons = true,
    editMode = true,

    placeholder = '',
    attachments = [],
    setAttachments = () => {},
    errorMessage = '',
    submitButtonText = 'Submit',
    isExpanded = true,
    onExpand = () => {},
    editorBackgroundColor: editorBackgroundColorProp,
    giphyVariant = 'uri',
    onGifSelect,
    showFormattingToggle = true,
    updateContent,
    showImageButton = false,
    showGifButton = false,
}) => {
    const isComputer = useIsComputer();
    const { theme } = useTheme();
    const styles = useMemo(
        () => createStyles(theme, editMode),
        [theme, editMode]
    );

    const [internalUpdateCount, setInternalUpdateCount] = useState(0);
    const resolvedUpdateContent = useMemo(
        () =>
            updateContent !== undefined ? updateContent : internalUpdateCount,
        [internalUpdateCount, updateContent]
    );

    const backgroundColor = editorBackgroundColorProp ?? theme.colors.TextInput;

    const { pickFile } = useFileUpload();
    const [showGiphy, setShowGiphy] = useState(false);
    const gifButtonRef = useRef<View>(null);
    const [gifButtonLayout, setGifButtonLayout] = useState<{
        x: number;
        y: number;
        width: number;
        height: number;
    }>();

    const handleAttachmentInsert = async () => {
        try {
            const file = await pickFile();
            if (!file) return;
            const uri = 'uri' in file ? file.uri : URL.createObjectURL(file);
            const newAtt: Attachment = {
                id: `${Date.now()}-${Math.random()}`,
                file,
                previewUri: uri,
            };
            setAttachments([...attachments, newAtt]);
        } catch {
            /* ignore */
        }
    };

    const handleGifPress = () => {
        if (gifButtonRef.current) {
            gifButtonRef.current.measure((x, y, w, h, px, py) => {
                setGifButtonLayout({ x: px, y: py, width: w, height: h });
                setShowGiphy(true);
            });
        } else {
            setShowGiphy(true);
        }
    };

    const handleGifSelect = useCallback(
        (att: Attachment) => {
            if (onGifSelect) {
                onGifSelect(att);
            }
            if (giphyVariant === 'uri') {
                // @ts-expect-error attachment
                const { uri } = att.file;
                const newContent = value
                    ? `${value}\n![GIF](${uri})`
                    : `![GIF](${uri})`;
                onChange(newContent);
                if (updateContent === undefined) {
                    setInternalUpdateCount((c) => c + 1);
                }
            } else if (giphyVariant === 'download') {
                // @ts-expect-error attachments
                setAttachments((atts: Attachment[]) => [...atts, att]);
            }
            setShowGiphy(false);
        },
        [
            giphyVariant,
            onChange,
            onGifSelect,
            setAttachments,
            updateContent,
            value,
        ]
    );

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
        }
    };
    // eslint-disable-next-line consistent-return
    useEffect(() => {
        if (isComputer) {
            globalThis.addEventListener('keydown', handleKeyDown);
            return () =>
                globalThis.removeEventListener('keydown', handleKeyDown);
        }
    }, [isComputer, onSubmit, onCancel]);

    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    const [selectedAttachment, setSelectedAttachment] = useState<
        Attachment | undefined
    >();
    const [previewParentSize, setPreviewParentSize] = useState({
        width: 0,
        height: 0,
    });

    return (
        <View style={styles.container}>
            <RichTextAndMarkdownEditor
                useRichTextEditor={useRichTextEditor}
                value={value}
                onChange={(t) => {
                    onChange(t);
                }}
                placeholder={placeholder}
                errorMessage={errorMessage}
                isExpanded={isExpanded}
                onExpand={onExpand}
                editorBackgroundColor={backgroundColor}
                showFormattingToggle={showFormattingToggle}
                updateContent={resolvedUpdateContent}
                expandedHeight={editMode ? undefined : 150}
                collapsedHeight={editMode ? undefined : 40}
            />

            {isExpanded && (showImageButton || showGifButton) && (
                <View style={styles.formatAndAttachContainer}>
                    {showImageButton && (
                        <TouchableOpacity
                            onPress={handleAttachmentInsert}
                            style={styles.imageButton}
                        >
                            <Icon name="image" size={24} color="white" />
                        </TouchableOpacity>
                    )}
                    {showGifButton && (
                        <TouchableOpacity
                            ref={gifButtonRef}
                            onPress={handleGifPress}
                            style={styles.gifButton}
                        >
                            <Text style={styles.gifButtonText}>GIF</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {attachments.length > 0 && (
                <AttachmentPreviews
                    attachments={attachments}
                    onAttachmentPress={(att) => {
                        setSelectedAttachment(att);
                        setPreviewModalVisible(true);
                    }}
                    onRemoveAttachment={(id) =>
                        setAttachments(attachments.filter((a) => a.id !== id))
                    }
                    onAttachmentsReorder={setAttachments}
                />
            )}

            {isExpanded && showButtonsEditButtons && (
                <View style={styles.buttonRow}>
                    <NexusButton
                        label="Cancel"
                        onPress={onCancel}
                        variant="outline"
                    />
                    <NexusButton
                        label={submitButtonText}
                        onPress={onSubmit}
                        variant="filled"
                    />
                </View>
            )}

            {showGifButton && (
                <GiphyModal
                    variant={giphyVariant}
                    visible={showGiphy}
                    onClose={() => setShowGiphy(false)}
                    anchorPosition={gifButtonLayout}
                    onSelectGif={handleGifSelect}
                />
            )}

            {previewModalVisible && selectedAttachment && (
                <CustomPortalModal
                    visible={previewModalVisible}
                    onClose={() => setPreviewModalVisible(false)}
                >
                    <TouchableOpacity
                        style={styles.previewModalOverlay}
                        onPress={() => setPreviewModalVisible(false)}
                        onLayout={(e) => {
                            const { width: w, height: h } =
                                e.nativeEvent.layout;
                            setPreviewParentSize({ width: w, height: h });
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
        </View>
    );
};

const createStyles = (theme: Theme, editMode?: boolean) =>
    StyleSheet.create({
        container: {
            marginTop: 10,
            marginBottom: 10,
            borderRadius: 5,
            padding: 10,
            position: 'relative',
            backgroundColor: editMode
                ? theme.colors.TertiaryBackground
                : 'none',
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
            fontFamily: 'Roboto_700Bold',
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
            justifyContent: 'space-around',
            marginTop: 8,
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
        urlText: {
            fontSize: 14,
            color: theme.colors.ActiveText,
            fontFamily: 'Roboto_400Regular',
            padding: 4,
        },
    });
