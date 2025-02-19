import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    TextInput,
    Pressable,
    StyleSheet,
    Platform,
    Image,
} from 'react-native';
import { COLORS } from '../constants';
import { useFileUpload } from '../hooks';
import { AttachmentPreviews, Attachment, RichTextEditor } from '../sections';

type CreateContentButtonProps = {
    modalVisible: boolean;
    setModalVisible: (visible: boolean) => void;
    contentText: string; // For the title (if using two fields) or for content (if single field)
    setContentText: (text: string) => void;
    handleCreate: () => void;
    buttonText: string;
    modalTitle?: string;
    showSecondField?: boolean;
    secondContentText?: string;
    setSecondContentText?: (text: string) => void;
    placeholderText?: string; // Placeholder for the first field (Title)
    placeholderText2?: string; // Placeholder for the second field (Content)
    multilineSecondField?: boolean;
    attachments: Attachment[];
    setAttachments: (attachments: Attachment[]) => void;
    enableImageAttachments?: boolean;
};

export const CreateContentButton: React.FC<CreateContentButtonProps> = ({
    modalVisible,
    setModalVisible,
    contentText,
    setContentText,
    handleCreate,
    buttonText,
    modalTitle,
    showSecondField = false,
    secondContentText = '',
    setSecondContentText = () => {},
    placeholderText = 'Enter title...',
    placeholderText2 = 'Enter content...',
    multilineSecondField = false,
    attachments,
    setAttachments,
    enableImageAttachments = false,
}) => {
    const { pickFile } = useFileUpload();
    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    const [selectedAttachment, setSelectedAttachment] =
        useState<Attachment | null>(null);

    // Attachment insert handler
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

    const onAttachmentPress = (attachment: Attachment) => {
        setSelectedAttachment(attachment);
        setPreviewModalVisible(true);
    };

    const onRemoveAttachment = (attachmentId: string) => {
        setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
    };

    return (
        <>
            <View style={styles.bottomSection}>
                <TouchableOpacity
                    style={styles.input}
                    onPress={() => setModalVisible(true)}
                >
                    <Text style={{ color: COLORS.InactiveText }}>
                        {buttonText}
                    </Text>
                </TouchableOpacity>
            </View>
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

                        {showSecondField ? (
                            <>
                                {/* First field: Plain text input for title */}
                                <TextInput
                                    placeholder={placeholderText}
                                    placeholderTextColor={COLORS.InactiveText}
                                    style={styles.textInput}
                                    value={contentText}
                                    onChangeText={setContentText}
                                />
                                {/* Second field: Rich Text Editor for content */}
                                <View style={styles.editorContainer}>
                                    <RichTextEditor
                                        initialContent={secondContentText}
                                        onChange={setSecondContentText}
                                    />
                                </View>
                            </>
                        ) : (
                            // Single field: Use RichTextEditor for content
                            <View style={styles.editorContainer}>
                                <RichTextEditor
                                    initialContent={contentText}
                                    onChange={setContentText}
                                />
                            </View>
                        )}

                        {enableImageAttachments && (
                            <TouchableOpacity
                                onPress={handleAttachmentInsert}
                                style={styles.attachImageButton}
                            >
                                <Text style={styles.attachImageButtonText}>
                                    Add Image
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
                        <Image
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

export default CreateContentButton;

const styles = StyleSheet.create({
    bottomSection: {
        // Removed absolute positioning so it doesn't overlap the modal content on web.
        // ...(Platform.OS === 'web'
        //   ? { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 }
        //   : {}),
        height: 60,
        borderTopWidth: 1,
        borderTopColor: '#4A3A5A',
        backgroundColor: COLORS.SecondaryBackground,
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    input: {
        backgroundColor: COLORS.TextInput,
        color: 'white',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        fontSize: 14,
    },
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
});
