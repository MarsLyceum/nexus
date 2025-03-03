// File: buttons/CreatePostModal.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    TextInput,
    Pressable,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { COLORS } from '../constants';
import { useFileUpload } from '../hooks';
import { AttachmentPreviews, Attachment, RichTextEditor } from '../sections';
import { MarkdownEditor } from './MarkdownEditor';

type CreatePostModalProps = {
    modalVisible: boolean;
    setModalVisible: (visible: boolean) => void;
    contentText: string; // Title (first field)
    setContentText: (text: string) => void;
    secondContentText: string; // Content (second field)
    setSecondContentText: (text: string) => void;
    handleCreate: () => void;
    buttonText: string;
    modalTitle?: string;
    placeholderText?: string; // For title
    placeholderText2?: string; // For content
    multilineSecondField?: boolean;
    attachments: Attachment[];
    setAttachments: (attachments: Attachment[]) => void;
    enableImageAttachments?: boolean;
};

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
    modalVisible,
    setModalVisible,
    contentText,
    setContentText,
    secondContentText,
    setSecondContentText,
    handleCreate,
    buttonText,
    modalTitle,
    placeholderText = 'Enter title...',
    placeholderText2 = 'Enter content...',
    multilineSecondField = false,
    attachments,
    setAttachments,
    enableImageAttachments = false,
}) => {
    const { pickFile } = useFileUpload();
    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    const [selectedAttachment, setSelectedAttachment] = useState<
        Attachment | undefined
    >(undefined);
    const [useMarkdown, setUseMarkdown] = useState(false);

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
            // @ts-expect-error any
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setAttachments((prev: any) => [...prev, newAttachment]);
        } catch (error) {
            console.error('Error in handleAttachmentInsert:', error);
        }
    };

    const onAttachmentPress = (attachment: Attachment) => {
        setSelectedAttachment(attachment);
        setPreviewModalVisible(true);
    };

    const onRemoveAttachment = (attachmentId: string) => {
        // @ts-expect-error any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAttachments((prev: any[]) =>
            prev.filter((att) => att.id !== attachmentId)
        );
    };

    return (
        <>
            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>
                            {modalTitle || buttonText}
                        </Text>
                        {/* First field: Title */}
                        <TextInput
                            placeholder={placeholderText}
                            placeholderTextColor={COLORS.InactiveText}
                            style={styles.textInput}
                            value={contentText}
                            onChangeText={setContentText}
                        />
                        {/* Second field: Content */}
                        {multilineSecondField ? (
                            <>
                                <TouchableOpacity
                                    onPress={() =>
                                        setUseMarkdown((prev) => !prev)
                                    }
                                    style={styles.toggleButton}
                                >
                                    <Text style={styles.toggleButtonText}>
                                        {useMarkdown
                                            ? 'Switch to Rich Text Editor'
                                            : 'Switch to Markdown Editor'}
                                    </Text>
                                </TouchableOpacity>
                                <View style={styles.editorContainer}>
                                    {useMarkdown ? (
                                        <MarkdownEditor
                                            value={secondContentText}
                                            onChangeText={setSecondContentText}
                                            placeholder={placeholderText2}
                                        />
                                    ) : (
                                        <RichTextEditor
                                            initialContent={secondContentText}
                                            onChange={setSecondContentText}
                                        />
                                    )}
                                </View>
                            </>
                        ) : (
                            <TextInput
                                placeholder={placeholderText2}
                                placeholderTextColor={COLORS.InactiveText}
                                style={[
                                    styles.textInput,
                                    { height: 100, textAlignVertical: 'top' },
                                ]}
                                value={secondContentText}
                                onChangeText={setSecondContentText}
                                multiline
                            />
                        )}

                        {enableImageAttachments && (
                            <TouchableOpacity
                                onPress={handleAttachmentInsert}
                                style={styles.attachImageButton}
                            >
                                <Text style={styles.attachImageButtonText}>
                                    Add Image or Video
                                </Text>
                            </TouchableOpacity>
                        )}

                        <AttachmentPreviews
                            attachments={attachments}
                            onAttachmentPress={onAttachmentPress}
                            onRemoveAttachment={onRemoveAttachment}
                        />

                        <View style={styles.modalButtonRow}>
                            <Pressable
                                style={styles.modalButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>
                                    Cancel
                                </Text>
                            </Pressable>
                            <Pressable
                                style={styles.modalButton}
                                onPress={handleCreate}
                            >
                                <Text style={styles.modalButtonText}>
                                    Create
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
            {previewModalVisible && selectedAttachment && (
                <Modal
                    visible={previewModalVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setPreviewModalVisible(false)}
                >
                    <TouchableOpacity
                        style={styles.previewModalOverlay}
                        onPress={() => setPreviewModalVisible(false)}
                    >
                        <ExpoImage
                            source={{ uri: selectedAttachment.previewUri }}
                            style={styles.previewModalImage}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                </Modal>
            )}
        </>
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
    editorContainer: {
        marginBottom: 20,
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
    previewModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewModalImage: {
        width: '90%',
        height: '90%',
        borderWidth: 2,
        borderColor: 'white',
    },
    attachImageButton: {
        backgroundColor: COLORS.Primary,
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
        alignSelf: 'flex-start',
        marginBottom: 15,
    },
    attachImageButtonText: {
        color: COLORS.White,
        fontWeight: '600',
    },
    toggleButton: {
        alignSelf: 'flex-end',
        marginBottom: 10,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: COLORS.SecondaryBackground,
        borderRadius: 5,
    },
    toggleButtonText: {
        color: COLORS.White,
        fontWeight: '600',
    },
});
