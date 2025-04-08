// DeleteMessageModal.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MiniModal } from './MiniModal'; // Import your existing MiniModal
import { COLORS } from '../constants';
import { MessageWithAvatar, DirectMessageWithAvatar } from '../types';
import { MessageContent } from './message';
import { NexusImage } from './NexusImage'; // So we can show the avatar
import { formatDateForChat } from '../utils';

export type DeleteMessageModalProps = {
    /** Whether this modal is visible. */
    visible: boolean;
    /**
     * Called when the user clicks “Cancel” (or outside the modal, if enabled).
     */
    onClose: () => void;
    /**
     * Called when the user confirms they want to delete the message.
     */
    onConfirmDelete: () => void;
    /** The message data, including avatar, username, content, etc. */
    message: MessageWithAvatar | DirectMessageWithAvatar;
    /** The width for rendering attachments/link previews. */
    width: number;
    /** Attachment press handler if your message includes attachments. */
    onAttachmentPress: (attachments: string[], index: number) => void;
};

export const DeleteMessageConfirmationModal: React.FC<
    DeleteMessageModalProps
> = ({
    visible,
    onClose,
    onConfirmDelete,
    message,
    width,
    onAttachmentPress,
}) => {
    // Format date/time similarly to your MessageItem logic
    const messageDate = message.postedAt
        ? new Date(message.postedAt)
        : new Date(message.createdAt);
    const formattedTime = formatDateForChat(messageDate);

    return (
        <MiniModal
            visible={visible}
            onClose={onClose}
            centered
            closeOnOutsideClick
            containerStyle={styles.modalContainer}
        >
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Delete Message</Text>
            </View>

            <View style={styles.body}>
                <Text style={styles.bodyText}>
                    Are you sure you want to delete this message?
                </Text>

                {/* Discord-style preview of the message */}
                <View style={styles.messagePreview}>
                    <View style={styles.authorRow}>
                        {/* Avatar */}
                        <NexusImage
                            source={message.avatar}
                            style={styles.avatar}
                            width={40}
                            height={40}
                            alt="User avatar"
                        />
                        <View style={styles.authorTextContainer}>
                            <Text style={styles.authorText}>
                                {message.username}{' '}
                                <Text style={styles.timestampText}>
                                    {formattedTime}
                                </Text>
                            </Text>
                        </View>
                    </View>

                    <View style={styles.messageContentContainer}>
                        <MessageContent
                            message={message}
                            width={width}
                            onAttachmentPress={onAttachmentPress}
                            renderMessage
                            renderLinkPreview
                            renderAttachments
                        />
                    </View>
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={onConfirmDelete}
                    style={styles.deleteButton}
                >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </MiniModal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        width: 420,
        maxWidth: 480,
        backgroundColor: COLORS.TertiaryBackground,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    header: {
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.White,
    },
    body: {
        marginBottom: 16,
    },
    bodyText: {
        fontSize: 14,
        color: COLORS.MainText,
        marginBottom: 16,
    },
    messagePreview: {
        backgroundColor: COLORS.SecondaryBackground,
        borderRadius: 4,
        padding: 10,
        marginBottom: 16,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    avatar: {
        borderRadius: 20,
        marginRight: 10,
    },
    authorTextContainer: {
        justifyContent: 'center',
    },
    authorText: {
        fontWeight: 'bold',
        color: COLORS.White,
        fontSize: 14,
    },
    timestampText: {
        fontSize: 12,
        color: COLORS.InactiveText,
    },
    messageContentContainer: {
        marginTop: 4,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    cancelButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginRight: 8,
        borderRadius: 4,
    },
    cancelButtonText: {
        color: COLORS.InactiveText,
        fontSize: 14,
    },
    deleteButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 4,
        backgroundColor: COLORS.Error,
    },
    deleteButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.White,
    },
});
