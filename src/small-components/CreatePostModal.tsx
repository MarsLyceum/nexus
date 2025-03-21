// CreatePostModal.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { COLORS } from '../constants';
import { Attachment, AttachmentPreviews } from '../sections';
import { CustomPortalModal } from './CustomPortalModal';
import { ContentEditor } from './ContentEditor';

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
    // These states are used only when not using the ContentEditor.
    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    const [selectedAttachment, setSelectedAttachment] = useState<
        Attachment | undefined
    >(undefined);

    const onAttachmentPress = (attachment: Attachment) => {
        setSelectedAttachment(attachment);
        setPreviewModalVisible(true);
    };

    return (
        <>
            <CustomPortalModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
            >
                <SafeAreaView style={{ flex: 1 }}>
                    <ScrollView
                        contentContainerStyle={styles.modalContentContainer}
                    >
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
                            <ContentEditor
                                value={secondContentText}
                                onChange={setSecondContentText}
                                placeholder={placeholderText2}
                                attachments={attachments}
                                setAttachments={setAttachments}
                                onSubmit={handleCreate}
                                onCancel={() => setModalVisible(false)}
                                submitButtonText="Create"
                                editorBackgroundColor={COLORS.PrimaryBackground}
                                giphyVariant="download"
                                showFormattingToggle={true}
                            />
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

                        {enableImageAttachments && !multilineSecondField && (
                            <View style={styles.buttonRow}>
                                {/* Attachments are handled here only when not using ContentEditor */}
                            </View>
                        )}

                        {/* --- Conditionally render attachment previews only when NOT using ContentEditor --- */}
                        {!multilineSecondField && (
                            <>
                                <AttachmentPreviews
                                    attachments={attachments}
                                    onAttachmentPress={onAttachmentPress}
                                    onRemoveAttachment={(id) =>
                                        setAttachments((prev: Attachment[]) =>
                                            prev.filter((att) => att.id !== id)
                                        )
                                    }
                                    onAttachmentsReorder={setAttachments}
                                />
                                {previewModalVisible && selectedAttachment && (
                                    <CustomPortalModal
                                        visible={previewModalVisible}
                                        onClose={() =>
                                            setPreviewModalVisible(false)
                                        }
                                    >
                                        <TouchableOpacity
                                            style={styles.previewModalOverlay}
                                            onPress={() =>
                                                setPreviewModalVisible(false)
                                            }
                                        >
                                            <ExpoImage
                                                source={{
                                                    uri: selectedAttachment.previewUri,
                                                }}
                                                style={styles.previewModalImage}
                                                contentFit="contain"
                                            />
                                        </TouchableOpacity>
                                    </CustomPortalModal>
                                )}
                            </>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </CustomPortalModal>
        </>
    );
};

const styles = StyleSheet.create({
    modalContentContainer: {
        padding: 20,
        flexGrow: 1,
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
    buttonRow: {
        flexDirection: 'row',
        marginBottom: 15,
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
});
