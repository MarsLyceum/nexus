// File: CreateEventCommentModal.tsx
import React, { useMemo } from 'react';
import {
    View,
    Text,
    Modal,
    TextInput,
    Pressable,
    StyleSheet,
} from 'react-native';

import { useTheme, Theme } from '../theme';
import { AttachmentPreviews } from '../sections/AttachmentPreviews';
import { Attachment } from '../types';
import { Spacing, BorderRadius, Typography } from '../constants/designSystem';
import { toRgba } from '../utils';

type CreateEventCommentModalProps = {
    modalVisible: boolean;
    setModalVisible: (visible: boolean) => void;
    contentText: string;
    setContentText: (text: string) => void;
    handleCreate: () => void;
    buttonText: string;
    attachments: Attachment[];
    setAttachments: (attachments: Attachment[]) => void;
};

export const CreateEventCommentModal: React.FC<
    CreateEventCommentModalProps
> = ({
    modalVisible,
    setModalVisible,
    contentText,
    setContentText,
    handleCreate,
    buttonText,
    attachments,
    setAttachments,
}) => {
    const onRemoveAttachment = (attachmentId: string) => {
        // @ts-expect-error any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAttachments((prev: any[]) =>
            prev.filter((att) => att.id !== attachmentId)
        );
    };

    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <Modal
            visible={modalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>{buttonText}</Text>
                    <TextInput
                        placeholder="Write your comment..."
                        placeholderTextColor={theme.colors.InactiveText}
                        style={styles.textInput}
                        value={contentText}
                        onChangeText={setContentText}
                    />
                    <AttachmentPreviews
                        attachments={attachments}
                        onAttachmentPress={() => {}}
                        onRemoveAttachment={onRemoveAttachment}
                        onAttachmentsReorder={setAttachments}
                    />
                    <View style={styles.modalButtonRow}>
                        <Pressable
                            style={styles.modalButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.modalButtonText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            style={styles.modalButton}
                            onPress={handleCreate}
                        >
                            <Text style={styles.modalButtonText}>Post</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

function createStyles(theme: Theme) {
    return StyleSheet.create({
        modalOverlay: {
            flex: 1,
            backgroundColor: toRgba('#000', 0.5),
            justifyContent: 'center',
            alignItems: 'center',
        },
        modalContainer: {
            width: '85%',
            backgroundColor: theme.colors.AppBackground,
            borderRadius: BorderRadius.Medium,
            padding: Spacing.XXL,
        },
        modalTitle: {
            ...Typography.SectionHeading,
            fontFamily: theme.fonts.primary?.semibold,
            marginBottom: Spacing.LG,
            color: theme.colors.ActiveText,
        },
        textInput: {
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, 0.08),
            borderRadius: BorderRadius.ExtraSmall,
            padding: Spacing.MD,
            marginBottom: Spacing.LG,
            color: theme.colors.ActiveText,
            ...Typography.Body,
            fontFamily: theme.fonts.primary?.regular,
        },
        modalButtonRow: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
        },
        modalButton: {
            marginLeft: Spacing.MD,
            paddingVertical: Spacing.SM,
            paddingHorizontal: Spacing.LG,
            borderRadius: BorderRadius.ExtraSmall,
            backgroundColor: theme.colors.Primary,
        },
        modalButtonText: {
            color: theme.colors.ActiveText,
            ...Typography.Button,
            fontFamily: theme.fonts.primary?.semibold,
        },
    });
}
