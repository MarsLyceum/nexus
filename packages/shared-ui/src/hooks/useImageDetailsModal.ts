import { useState } from 'react';
import type { Attachment } from '../types';

export const useImageDetailsModal = () => {
    // Modal state for image previews.
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [modalAttachments, setModalAttachments] = useState<string[]>([]);
    const [modalInitialIndex, setModalInitialIndex] = useState<number>(0);

    // Generic function to open the modal with provided attachments and initial index.
    const openImagePreview = (
        attachments: string[],
        initialIndex: number = 0
    ) => {
        setModalAttachments(attachments);
        setModalInitialIndex(initialIndex);
        setModalVisible(true);
    };

    // Handler to close the modal.
    const closeImagePreview = () => {
        setModalVisible(false);
    };

    // Handler for inline image press – open with one image.
    const handleInlineImagePress = (url: string) => {
        openImagePreview([url], 0);
    };

    // Handler for attachment preview press (e.g., from ChatInput).
    const handleAttachmentPreviewPress = (att: Attachment) => {
        openImagePreview([att.previewUri], 0);
    };

    // Handler for when an image inside a message item is tapped.
    const handleMessageItemAttachmentPress = (
        attachments: string[],
        index: number
    ) => {
        openImagePreview(attachments, index);
    };

    return {
        modalVisible,
        modalAttachments,
        modalInitialIndex,
        closeImagePreview,
        handleInlineImagePress,
        handleAttachmentPreviewPress,
        handleMessageItemAttachmentPress,
    };
};
