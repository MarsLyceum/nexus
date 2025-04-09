// CommentEditor.tsx
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppSelector, RootState, UserType } from '../redux';
import { COLORS } from '../constants';
import { ContentEditor } from './ContentEditor';
import { Attachment } from '../types';
import { useCreateComment } from '../hooks';

export type CommentEditorProps = {
    postId: string;
    parentCommentId: string | null;
    onCancel?: () => void;
    onCommentCreated?: () => void;
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
    const user: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );

    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [newCommentContent, setNewCommentContent] = useState('');
    const [updateContent, setUpdateContent] = useState(0);
    const [isExpanded, setIsExpanded] = useState(expandedByDefault);
    const [errorMessage, setErrorMessage] = useState('');

    const { createComment, creatingComment } = useCreateComment(() => {
        setAttachments([]);
        setNewCommentContent('');
        setIsExpanded(false);
        setErrorMessage('');
        if (onCommentCreated) onCommentCreated();
    });

    const handleCreateComment = async () => {
        if (!postId || !user?.id || creatingComment) return;
        if (!newCommentContent.trim() && attachments.length === 0) {
            setErrorMessage('Comment cannot be empty.');
            return;
        }
        setErrorMessage('');
        await createComment({
            postedByUserId: user.id,
            postId,
            content: newCommentContent,
            attachments: attachments.map((att) => att.file),
            parentCommentId,
            hasChildren: false,
            upvotes: 1,
        });
    };

    const handleExpand = () => {
        setIsExpanded(true);
    };

    const handleCancel = () => {
        setIsExpanded(false);
        setNewCommentContent('');
        setAttachments([]);
        setErrorMessage('');
        if (onCancel) onCancel();
    };

    return (
        <View style={styles.container}>
            <ContentEditor
                value={newCommentContent}
                onChange={(text) => {
                    setNewCommentContent(text);
                    if (errorMessage) setErrorMessage('');
                }}
                placeholder="Write a comment..."
                attachments={attachments}
                setAttachments={setAttachments}
                errorMessage={errorMessage}
                onSubmit={handleCreateComment}
                onCancel={handleCancel}
                submitButtonText="Comment"
                isExpanded={isExpanded}
                onExpand={handleExpand}
                editorBackgroundColor={editorBackgroundColor}
                giphyVariant="uri"
                onGifSelect={(attachment) => {
                    // @ts-expect-error file
                    setNewCommentContent(attachment.file.uri);
                    setUpdateContent((prev) => prev + 1);
                }}
                showFormattingToggle
                updateContent={updateContent}
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
});
