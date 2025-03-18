import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { Image as ExpoImage } from 'expo-image';
import { COLORS } from '../constants';
import { useFileUpload } from '../hooks';
import { AttachmentPreviews, Attachment, RichTextEditor } from '../sections';
import { MarkdownEditor } from './MarkdownEditor';
import { GiphyModal } from './GiphyModal';
import { CustomPortalModal } from './CustomPortalModal';

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
    const [showGiphy, setShowGiphy] = useState(false);

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

    const handleGifPress = () => {
        setShowGiphy(true);
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
                            <View style={styles.buttonRow}>
                                <TouchableOpacity
                                    onPress={handleAttachmentInsert}
                                    style={styles.imageButton}
                                >
                                    <Icon
                                        name="image"
                                        size={24}
                                        color="white"
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleGifPress}
                                    style={styles.gifButton}
                                >
                                    <Text style={styles.gifButtonText}>
                                        GIF
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <AttachmentPreviews
                            attachments={attachments}
                            onAttachmentPress={onAttachmentPress}
                            onRemoveAttachment={onRemoveAttachment}
                            onAttachmentsReorder={setAttachments}
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
                    </ScrollView>
                </SafeAreaView>
            </CustomPortalModal>

            {previewModalVisible && selectedAttachment && (
                <CustomPortalModal
                    visible={previewModalVisible}
                    onClose={() => setPreviewModalVisible(false)}
                >
                    <TouchableOpacity
                        style={styles.previewModalOverlay}
                        onPress={() => setPreviewModalVisible(false)}
                    >
                        <ExpoImage
                            source={{ uri: selectedAttachment.previewUri }}
                            style={styles.previewModalImage}
                            contentFit="contain"
                        />
                    </TouchableOpacity>
                </CustomPortalModal>
            )}

            <GiphyModal
                variant="download"
                visible={showGiphy}
                onClose={() => setShowGiphy(false)}
                onSelectGif={(attachment) =>
                    // @ts-expect-error attachment
                    setAttachments((prev) => [...prev, attachment])
                }
            />
        </>
    );
};

const styles = StyleSheet.create({
    modalContentContainer: {
        padding: 20,
        flexGrow: 1,
        overflowY: 'auto',
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
    buttonRow: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    imageButton: {
        marginRight: 10,
        padding: 8,
        backgroundColor: COLORS.SecondaryBackground,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gifButton: {
        marginHorizontal: 10,
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
});
