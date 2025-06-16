// src/small-components/ContentEditor.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StyleProp,
    TextStyle,
    StyleSheet as RNStyleSheet,
    LayoutChangeEvent,
    TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

import { extractUrls } from '../utils';
import { NexusButton } from '../buttons';
import { useTheme, Theme } from '../theme';
import { RichTextEditor } from '../sections';
import { useFileUpload, useIsComputer } from '../hooks';

import { MarkdownEditor } from './MarkdownEditor';
import { RichTextAndMarkdownEditor } from './RichTextAndMarkdownEditor';

import { GiphyModal } from './GiphyModal';
import { AttachmentPreviews } from '../sections/AttachmentPreviews';
import { NexusImage } from './NexusImage';
import { CustomPortalModal } from './CustomPortalModal';
import { Attachment } from '../types';

export type ContentEditorProps = {
    value: string;
    onChange: (text: string) => void;
    width: number;
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
    width,
    onSubmit = () => {},
    onCancel = () => {},
    useRichTextEditor = false,
    showButtonsEditButtons = true,
    editMode = true,

    height = 40,
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
    const resolvedUpdateContent =
        updateContent !== undefined ? updateContent : internalUpdateCount;

    const [editedContent, setEditedContent] = useState(value);
    useEffect(() => setEditedContent(value), [value]);

    const [editorHeight, setEditorHeight] = useState(height);
    const [avgCharWidth, setAvgCharWidth] = useState<number>();
    const [measuredLineHeight, setMeasuredLineHeight] = useState<number>();

    const isOnlyUrl =
        extractUrls(editedContent).length === 1 &&
        editedContent.trim() === extractUrls(editedContent)[0];

    const backgroundColor =
        editorBackgroundColorProp ?? theme.colors.PrimaryBackground;

    const estimateHeightForUrl = (
        text: string,
        containerWidth: number,
        avgWidth: number,
        lineHeight: number,
        horizPad: number,
        vertPad: number
        // eslint-disable-next-line unicorn/consistent-function-scoping
    ) => {
        if (!text.trim()) return 60;
        const effW = containerWidth - horizPad;
        const charsPerLine = Math.max(1, Math.floor(effW / avgWidth));
        const lines = Math.ceil(text.length / charsPerLine);
        return lines * lineHeight + vertPad;
    };

    useEffect(() => {
        if (!editedContent.trim()) {
            setEditorHeight(height);
            return;
        }
        if (
            isOnlyUrl &&
            avgCharWidth &&
            measuredLineHeight &&
            typeof width === 'number'
        ) {
            const flat: StyleProp<TextStyle> =
                RNStyleSheet.flatten(styles.urlText) || {};
            const horiz =
                flat.paddingHorizontal ??
                (typeof flat.padding === 'number' ? flat.padding * 2 : 0);
            const vert =
                flat.paddingVertical ??
                (typeof flat.padding === 'number' ? flat.padding * 2 : 0);
            const h = estimateHeightForUrl(
                editedContent,
                width,
                avgCharWidth,
                measuredLineHeight,
                horiz as number,
                vert as number
            );
            setEditorHeight(Math.max(height, h));
        }
    }, [
        editedContent,
        isOnlyUrl,
        avgCharWidth,
        measuredLineHeight,
        width,
        styles.urlText,
    ]);

    const handleHiddenLayout = (e: LayoutChangeEvent) => {
        const { height: eventHeight } = e.nativeEvent.layout;
        setEditorHeight(Math.max(height, eventHeight));
    };

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

    const handleGifSelect = (att: Attachment) => {
        if (onGifSelect) {
            onGifSelect(att);
        }
        if (giphyVariant === 'uri') {
            // @ts-expect-error attachment
            const { uri } = att.file;
            const newContent = `${editedContent}\n![](${uri})`;
            setEditedContent(newContent);
            onChange(newContent);
            if (updateContent === undefined) {
                setInternalUpdateCount((c) => c + 1);
            }
        } else if (giphyVariant === 'download') {
            // @ts-expect-error attachments
            setAttachments((atts: Attachment[]) => [...atts, att]);
        }
        setShowGiphy(false);
    };

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleContentSizeChange = (e: any) => {
        const newHeight = e.nativeEvent.contentSize.height;
        console.log('Markdown size:', newHeight);
        setEditorHeight(newHeight);
        if (updateContent === undefined) {
            setInternalUpdateCount((c) => c + 1);
        }
    };

    return (
        <View style={styles.container}>
            {!isOnlyUrl && (
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        opacity: 0,
                        width,
                    }}
                    onLayout={handleHiddenLayout}
                >
                    <MarkdownEditor
                        placeholder={placeholder}
                        value={editedContent}
                        onChangeText={onChange}
                        height={`${editorHeight ?? 150}px`}
                        onContentSizeChange={handleContentSizeChange}
                    />
                </View>
            )}

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
                            const { width: innerWidth, height: innerHeight } =
                                e.nativeEvent.layout;
                            setAvgCharWidth(innerWidth);
                            setMeasuredLineHeight(innerHeight);
                        }}
                    >
                        M
                    </Text>
                )}

            <RichTextAndMarkdownEditor
                useRichTextEditor={useRichTextEditor}
                value={editedContent}
                onChange={(t) => {
                    setEditedContent(t);
                    onChange(t);
                }}
                placeholder={placeholder}
                errorMessage={errorMessage}
                isExpanded={isExpanded}
                onExpand={onExpand}
                editorBackgroundColor={backgroundColor}
                showFormattingToggle={showFormattingToggle}
                updateContent={resolvedUpdateContent}
                height={`${editorHeight}px`}
                expandedHeight={editMode ? undefined : 150}
                collapsedHeight={editMode ? undefined : 40}
                onContentSizeChange={handleContentSizeChange}
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

            {showButtonsEditButtons && (
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
