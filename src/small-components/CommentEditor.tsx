import React, { useState } from 'react';
import {
    View,
    Pressable,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { MarkdownEditor } from '../small-components/MarkdownEditor';
import { Tooltip } from './Tooltip';
import { RichTextEditor } from '../sections/RichTextEditor';
import { AttachmentPreviews, Attachment } from '../sections';
import { useCreateComment, useFileUpload } from '../hooks';
import { useAppSelector, RootState, UserType } from '../redux';
import { COLORS } from '../constants';
import { FormattingOptions } from '../icons/FormattingOptions';
import { GiphyModal } from './GiphyModal';

type CommentEditorProps = {
    postId: string;
    parentCommentId?: string;
    /**
     * Called if the user clicks the "Cancel" button
     */
    onCancel?: () => void;
    /**
     * Called after a comment is successfully created
     */
    onCommentCreated?: () => void;
    /**
     * Editor background color for both Markdown and Rich Text editors
     */
    editorBackgroundColor?: string;
    expandedByDefault?: boolean;
};

export const CommentEditor: React.FC<CommentEditorProps> = ({
    postId,
    parentCommentId,
    onCancel,
    onCommentCreated,
    editorBackgroundColor = COLORS.PrimaryBackground,
    expandedByDefault = false,
}) => {
    // Grab the current user from Redux
    const user: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );

    // Local state
    const [useMarkdown, setUseMarkdown] = useState(false);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [newCommentContent, setNewCommentContent] = useState('');
    const [updateContent, setUpdateContent] = useState(0);
    // Control whether the editor is expanded
    const [isExpanded, setIsExpanded] = useState(expandedByDefault);
    // State to toggle the formatting toolbar in the rich text editor.
    const [showFormattingOptions, setShowFormattingOptions] = useState(false);
    // State for Giphy modal visibility
    const [showGiphy, setShowGiphy] = useState(false);
    // State for error messages
    const [errorMessage, setErrorMessage] = useState('');

    // Hook for file upload functionality
    const { pickFile } = useFileUpload();

    // Custom hook to create comments
    const { createComment, creatingComment } = useCreateComment(() => {
        // On success, clear attachments and text, collapse the editor, and call the onCommentCreated callback if provided.
        setAttachments([]);
        setNewCommentContent('');
        setIsExpanded(false); // Close the editor
        setErrorMessage(''); // Clear any existing error
        if (onCommentCreated) onCommentCreated();
    });

    // Remove an attachment from the preview list
    const onRemoveAttachment = (attachmentId: string) => {
        setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
    };

    // Attempt to create a comment
    const handleCreateComment = async () => {
        if (!postId || !user?.id || creatingComment) return;
        // Check if comment text is empty (after trimming) and no attachments are added
        if (!newCommentContent.trim() && attachments.length === 0) {
            setErrorMessage('Comment cannot be empty.');
            return;
        }
        // Clear any previous error
        setErrorMessage('');
        await createComment({
            postedByUserId: user.id,
            postId,
            content: newCommentContent,
            attachments: attachments.map((att) => att.file),
            // eslint-disable-next-line unicorn/no-null
            parentCommentId: parentCommentId ?? null,
            hasChildren: false,
            upvotes: 1,
        });
    };

    // When the editor is focused, expand the editor.
    const handleExpand = () => {
        setIsExpanded(true);
    };

    // When cancel is pressed, collapse and clear content (and hide extra options)
    const handleCancel = () => {
        setIsExpanded(false);
        setNewCommentContent('');
        setAttachments([]);
        setShowFormattingOptions(false);
        setErrorMessage(''); // Clear error message on cancel
        if (onCancel) onCancel();
    };

    // Handle image attachment insertion
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
            setAttachments((prev) => [...prev, newAttachment]);
        } catch (error) {
            console.error('Error in handleAttachmentInsert:', error);
        }
    };

    // Handle GIF button press to show the Giphy modal
    const handleGifPress = () => {
        setShowGiphy(true);
    };

    return (
        <View style={styles.container}>
            {isExpanded ? (
                <>
                    {/* Toggle between Markdown and Rich Text (visible when expanded) */}
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

                    {/* Expanded Editor section */}
                    <View style={styles.editorContainer}>
                        {useMarkdown ? (
                            <MarkdownEditor
                                placeholder="Write a comment..."
                                value={newCommentContent}
                                onChangeText={(text) => {
                                    setNewCommentContent(text);
                                    // Optionally clear error when user starts typing
                                    if (errorMessage) setErrorMessage('');
                                }}
                                height="150px"
                                backgroundColor={editorBackgroundColor}
                            />
                        ) : (
                            <RichTextEditor
                                placeholder="Write a comment..."
                                initialContent={newCommentContent}
                                onChange={(text) => {
                                    setNewCommentContent(text);
                                    // Optionally clear error when user starts typing
                                    if (errorMessage) setErrorMessage('');
                                }}
                                showToolbar={showFormattingOptions}
                                height="150px"
                                backgroundColor={editorBackgroundColor}
                                updateContent={updateContent}
                            />
                        )}
                    </View>

                    {/* Attachment Buttons (Image and GIF) are always visible.
                        The formatting options button is shown only for Rich Text mode */}
                    <View style={styles.formatAndAttachContainer}>
                        <TouchableOpacity
                            onPress={handleAttachmentInsert}
                            style={styles.imageButton}
                        >
                            <Icon name="image" size={24} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleGifPress}
                            style={styles.gifButton}
                        >
                            <Text style={styles.gifButtonText}>GIF</Text>
                        </TouchableOpacity>
                        {!useMarkdown && (
                            <Pressable
                                style={[
                                    styles.formatToggleButton,
                                    {
                                        backgroundColor: showFormattingOptions
                                            ? COLORS.Primary
                                            : 'transparent',
                                    },
                                ]}
                                onPress={() =>
                                    setShowFormattingOptions((prev) => !prev)
                                }
                            >
                                <Tooltip
                                    tooltipText={
                                        showFormattingOptions
                                            ? 'Hide formatting options'
                                            : 'Show formatting options'
                                    }
                                >
                                    <FormattingOptions
                                        size={18}
                                        color={COLORS.White}
                                    />
                                </Tooltip>
                            </Pressable>
                        )}
                    </View>

                    {/* Attachment previews */}
                    <AttachmentPreviews
                        attachments={attachments}
                        onAttachmentPress={() => {}}
                        onRemoveAttachment={onRemoveAttachment}
                        onAttachmentsReorder={setAttachments}
                    />

                    {/* Display error message if any */}
                    {errorMessage ? (
                        <Text style={styles.errorMessage}>{errorMessage}</Text>
                    ) : undefined}

                    {/* Action buttons */}
                    <View style={styles.buttonRow}>
                        <Pressable
                            style={styles.cancelButton}
                            onPress={handleCancel}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            style={styles.postButton}
                            onPress={handleCreateComment}
                        >
                            <Text style={styles.postButtonText}>Comment</Text>
                        </Pressable>
                    </View>
                </>
            ) : (
                // Collapsed state: Render the minimal editor that expands on focus.
                // We pass an onFocus handler so that clicking inside triggers expansion.
                <>
                    {useMarkdown ? (
                        <MarkdownEditor
                            placeholder="Write a comment..."
                            value={newCommentContent}
                            onChangeText={(text) => {
                                setNewCommentContent(text);
                                if (errorMessage) setErrorMessage('');
                            }}
                            height="40px"
                            editable
                            onFocus={handleExpand}
                            backgroundColor={editorBackgroundColor}
                        />
                    ) : (
                        <RichTextEditor
                            placeholder="Write a comment..."
                            initialContent={newCommentContent}
                            onChange={(text) => {
                                setNewCommentContent(text);
                                if (errorMessage) setErrorMessage('');
                            }}
                            showToolbar={false}
                            height="40px"
                            onFocus={handleExpand}
                            backgroundColor={editorBackgroundColor}
                        />
                    )}
                </>
            )}

            {/* Giphy Modal */}
            <GiphyModal
                variant="uri"
                visible={showGiphy}
                onClose={() => setShowGiphy(false)}
                onSelectGif={(attachment) => {
                    // @ts-expect-error file
                    setNewCommentContent(attachment.file.uri);
                    setUpdateContent((prev) => prev + 1);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
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
        backgroundColor: COLORS.Primary,
    },
    toggleButtonText: {
        color: COLORS.White,
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
    formatToggleButton: {
        marginLeft: 10,
        padding: 8,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageButton: {
        marginLeft: 10,
        padding: 8,
        backgroundColor: COLORS.SecondaryBackground,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gifButton: {
        marginLeft: 10,
        padding: 8,
        backgroundColor: COLORS.SecondaryBackground,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gifButtonText: {
        color: COLORS.White,
        fontSize: 16,
        fontWeight: 'bold',
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
        backgroundColor: COLORS.White,
        borderWidth: 1,
        borderColor: COLORS.Primary,
    },
    cancelButtonText: {
        color: COLORS.Primary,
        fontWeight: '600',
    },
    postButton: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
        backgroundColor: COLORS.Primary,
    },
    postButtonText: {
        color: COLORS.White,
        fontWeight: '600',
    },
    errorMessage: {
        color: COLORS.Error,
        marginBottom: 5,
        textAlign: 'center',
    },
});
