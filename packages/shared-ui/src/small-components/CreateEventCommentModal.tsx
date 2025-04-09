// File: buttons/CreateEventCommentModal.tsx
import React from 'react';
import {
    View,
    Text,
    Modal,
    TextInput,
    Pressable,
    StyleSheet,
} from 'react-native';
import { COLORS } from '../constants';
import { AttachmentPreviews } from '../sections';
import { Attachment } from '../types';

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
                        placeholderTextColor={COLORS.InactiveText}
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

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '85%',
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
    textInput: {
        borderWidth: 1,
        borderColor: COLORS.InactiveText,
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
        color: COLORS.White,
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
});
