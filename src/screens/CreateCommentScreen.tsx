import React, { useState, useContext } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { NavigationProp } from '@react-navigation/core';
import { COLORS } from '../constants';
import { AttachmentPreviews, Attachment } from '../sections';
import { MarkdownEditor } from '../small-components/MarkdownEditor';
import { MarkdownRenderer } from '../small-components/MarkdownRenderer';
import { RichTextEditor } from '../sections/RichTextEditor';
import { getRelativeTime } from '../utils';
import { CurrentCommentContext } from '../providers';

type RootStackParamList = {
    CreateComment: Record<string, unknown>;
};

type CreateCommentScreenProps = {
    navigation: NavigationProp<RootStackParamList, 'CreateComment'>;
};

export const CreateCommentScreen: React.FC<CreateCommentScreenProps> = ({
    navigation,
}) => {
    const [useMarkdown, setUseMarkdown] = useState(false);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [newCommentContent, setNewCommentContent] = useState('');
    const { parentUser, parentContent, parentDate } = useContext(
        CurrentCommentContext
    );

    const onRemoveAttachment = (attachmentId: string) => {
        setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
    };

    return (
        <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContainerStyle}
        >
            <View style={styles.modalContainer}>
                <Text style={styles.userInfo}>
                    {parentUser} • {getRelativeTime(parentDate)}
                </Text>
                <View style={styles.parentContentContainer}>
                    <MarkdownRenderer text={parentContent} preview />
                </View>
                <Pressable onPress={() => setUseMarkdown(!useMarkdown)}>
                    <Text style={styles.toggleButton}>
                        {useMarkdown
                            ? 'Switch to Rich Text'
                            : 'Switch to Markdown'}
                    </Text>
                </Pressable>
                <View style={styles.editorContainer}>
                    {useMarkdown ? (
                        <MarkdownEditor
                            placeholder="Write a comment..."
                            value={newCommentContent}
                            onChangeText={setNewCommentContent}
                        />
                    ) : (
                        <RichTextEditor
                            placeholder="Write a comment..."
                            initialContent={newCommentContent}
                            onChange={setNewCommentContent}
                        />
                    )}
                </View>
                <AttachmentPreviews
                    attachments={attachments}
                    onAttachmentPress={() => {}}
                    onRemoveAttachment={onRemoveAttachment}
                />
                <View style={styles.modalButtonRow}>
                    <Pressable
                        style={styles.modalButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.modalButtonText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                        style={styles.modalButton}
                        onPress={() => alert('making comment')}
                    >
                        <Text style={styles.modalButtonText}>Post</Text>
                    </Pressable>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        flex: 1,
        backgroundColor: COLORS.AppBackground,
    },
    scrollContainerStyle: {
        // flexGrow: 1,
    },
    modalContainer: {
        backgroundColor: COLORS.AppBackground,
        borderRadius: 8,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
        color: COLORS.White,
    },
    userInfo: {
        fontSize: 14,
        color: COLORS.InactiveText,
        marginBottom: 10,
    },
    parentContentContainer: {
        borderWidth: 1,
        borderColor: COLORS.InactiveText,
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
        backgroundColor: COLORS.SecondaryBackground,
    },
    toggleButton: {
        color: COLORS.Primary,
        textAlign: 'right',
        marginBottom: 10,
    },
    modalButtonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    modalButton: {
        marginLeft: 10,
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
        backgroundColor: COLORS.Primary,
    },
    modalButtonText: {
        color: COLORS.White,
        fontWeight: '600',
    },
    editorContainer: {
        marginBottom: 15,
    },
});
