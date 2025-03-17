// CommentEditor.tsx
import React, { useState } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { MarkdownEditor } from '../small-components/MarkdownEditor';
import { Tooltip } from './Tooltip';
import { RichTextEditor } from '../sections/RichTextEditor';
import { AttachmentPreviews, Attachment } from '../sections';
import { useCreateComment } from '../hooks';
import { useAppSelector, RootState, UserType } from '../redux';
import { COLORS } from '../constants';
import { FormattingOptions } from '../icons/FormattingOptions';

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
};

export const CommentEditor: React.FC<CommentEditorProps> = ({
    postId,
    parentCommentId,
    onCancel,
    onCommentCreated,
}) => {
    // Grab the current user from Redux
    const user: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );

    // Local state
    const [useMarkdown, setUseMarkdown] = useState(false);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [newCommentContent, setNewCommentContent] = useState('');
    // Control whether the editor is expanded
    const [isExpanded, setIsExpanded] = useState(false);
    // State to toggle the formatting toolbar in the rich text editor.
    const [showFormattingOptions, setShowFormattingOptions] = useState(false);

    // Custom hook to create comments
    const { createComment, creatingComment } = useCreateComment(() => {
        // Clear attachments and text on success
        setAttachments([]);
        setNewCommentContent('');
        if (onCommentCreated) onCommentCreated();
    });

    // Remove an attachment from the preview list
    const onRemoveAttachment = (attachmentId: string) => {
        setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
    };

    // Attempt to create a comment
    const handleCreateComment = async () => {
        if (!postId || !user?.id || creatingComment) return;
        await createComment({
            postedByUserId: user.id,
            postId,
            content: newCommentContent,
            attachments: attachments.map((att) => att.file),
            parentCommentId,
            hasChildren: false,
            children: [],
            upvotes: 1,
        });
    };

    // When the editor is focused, expand the editor.
    const handleExpand = () => {
        setIsExpanded(true);
        setShowFormattingOptions(true);
    };

    // When cancel is pressed, collapse and clear content (and hide extra options)
    const handleCancel = () => {
        setIsExpanded(false);
        setNewCommentContent('');
        setAttachments([]);
        setShowFormattingOptions(false);
        if (onCancel) onCancel();
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
                                onChangeText={setNewCommentContent}
                                // Optionally, pass onFocus if supported
                                height="150px"
                            />
                        ) : (
                            <RichTextEditor
                                placeholder="Write a comment..."
                                initialContent={newCommentContent}
                                onChange={setNewCommentContent}
                                showToolbar={showFormattingOptions}
                                height="150px"
                            />
                        )}
                    </View>

                    {/* Formatting Options toggle (only in Rich Text mode) */}
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

                    {/* Attachment previews */}
                    <AttachmentPreviews
                        attachments={attachments}
                        onAttachmentPress={() => {}}
                        onRemoveAttachment={onRemoveAttachment}
                        onAttachmentsReorder={setAttachments}
                    />

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
                            onChangeText={setNewCommentContent}
                            height="40px"
                            editable
                            onFocus={handleExpand}
                        />
                    ) : (
                        <RichTextEditor
                            placeholder="Write a comment..."
                            initialContent={newCommentContent}
                            onChange={setNewCommentContent}
                            showToolbar={false}
                            height="40px"
                            // Assuming RichTextEditor supports onFocus:
                            onFocus={handleExpand}
                        />
                    )}
                </>
            )}
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
        backgroundColor: COLORS.SecondaryBackground,
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
    formatToggleButton: {
        position: 'absolute',
        left: 10,
        bottom: 10,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 5,
        zIndex: 1000,
    },
});
