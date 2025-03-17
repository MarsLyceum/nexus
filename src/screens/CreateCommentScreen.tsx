import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    ScrollView,
    Platform,
    SafeAreaView,
} from 'react-native';
import { NavigationProp } from '@react-navigation/core';
import { COLORS } from '../constants';
import { AttachmentPreviews, Attachment } from '../sections';
import { MarkdownEditor } from '../small-components/MarkdownEditor';
import { MarkdownRenderer } from '../small-components/MarkdownRenderer';
import { RichTextEditor } from '../sections/RichTextEditor';
import { getRelativeTime } from '../utils';
import { CurrentCommentContext } from '../providers';
import { useCreateComment } from '../hooks';
import { useAppSelector, RootState, UserType } from '../redux';

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
    const { parentUser, parentContent, parentDate, parentCommentId, postId } =
        useContext(CurrentCommentContext);
    const user: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );

    const onRemoveAttachment = (attachmentId: string) => {
        setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
    };

    const { createComment, creatingComment } = useCreateComment(() => {
        setAttachments([]); // Clear attachments on success
    });

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
        navigation.goBack();
    };

    return (
        // @ts-expect-error web only types
        <SafeAreaView style={styles.safeContainer}>
            {/* @ts-expect-error web only types */}
            <ScrollView
                style={styles.scrollSection}
                contentContainerStyle={styles.scrollContainerStyle}
            >
                {/* @ts-expect-error web only types */}
                <View style={styles.modalContainer}>
                    {/* @ts-expect-error web only types */}
                    <Text style={styles.userInfo}>
                        {parentUser} • {getRelativeTime(parentDate)}
                    </Text>
                    {/* @ts-expect-error web only types */}
                    <View style={styles.parentContentContainer}>
                        <MarkdownRenderer text={parentContent} preview />
                    </View>
                    <Pressable
                        onPress={() => setUseMarkdown((prev) => !prev)}
                        // @ts-expect-error web only types
                        style={styles.toggleButton}
                    >
                        {/* @ts-expect-error web only types */}
                        <Text style={styles.toggleButtonText}>
                            {useMarkdown
                                ? 'Switch to Rich Text Editor'
                                : 'Switch to Markdown Editor'}
                        </Text>
                    </Pressable>

                    {/* @ts-expect-error web only types */}
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
                        onAttachmentsReorder={setAttachments}
                    />
                    {/* @ts-expect-error web only types */}
                    <View style={styles.modalButtonRow}>
                        <Pressable
                            // @ts-expect-error web only types
                            style={styles.modalButton}
                            onPress={() => navigation.goBack()}
                        >
                            {/* @ts-expect-error web only types */}
                            <Text style={styles.modalButtonText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            // @ts-expect-error web only types
                            style={styles.modalButton}
                            onPress={handleCreateComment}
                        >
                            {/* @ts-expect-error web only types */}
                            <Text style={styles.modalButtonText}>Comment</Text>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
    scrollSection: isWeb
        ? {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflowY: 'auto',
              backgroundColor: COLORS.AppBackground,
          }
        : { flex: 1, backgroundColor: COLORS.AppBackground },
    // @ts-expect-error web only type
    safeContainer: {
        flex: 1,
        backgroundColor: COLORS.SecondaryBackground,
        paddingTop: 15,
        ...(isWeb && { height: '100vh', display: 'flex' }),
    },
    scrollContainer: {
        flex: 1,
        backgroundColor: COLORS.AppBackground,
    },
    scrollContainerStyle: {
        flexGrow: 1,
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
        alignSelf: 'flex-end',
        marginBottom: 10,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: COLORS.SecondaryBackground,
        borderRadius: 5,
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
    toggleButtonText: {
        color: COLORS.White,
        fontWeight: '600',
    },
});
