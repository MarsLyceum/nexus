// DeleteMessageModal.tsx
import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import { useTheme, Theme } from '../theme';
import { MessageWithAvatar, DirectMessageWithAvatar } from '../types';
import { MessageContent } from './message';
import { formatDateForChat } from '../utils';

import { NexusImage } from './NexusImage'; // So we can show the avatar
import { MiniModal } from './MiniModal'; // Import your existing MiniModal

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
    /** Attachment press handler if your message includes attachments. */
    onAttachmentPress: (attachments: string[], index: number) => void;
};

export const DeleteMessageConfirmationModal: React.FC<
    DeleteMessageModalProps
> = ({ visible, onClose, onConfirmDelete, message, onAttachmentPress }) => {
    const [modalWidth, setModalWidth] = useState<number>(420);
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    // Format date/time similarly to your MessageItem logic
    // @ts-expect-error messag
    const messageDate = message.postedAt
        ? // @ts-expect-error messag
          new Date(message.postedAt)
        : // @ts-expect-error messag
          new Date(message.createdAt);
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

                    <View
                        style={styles.messageContentContainer}
                        onLayout={(e) => {
                            const measuredWidth = e.nativeEvent.layout.width;
                            setModalWidth(measuredWidth);
                        }}
                    >
                        <MessageContent
                            message={message}
                            width={modalWidth}
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

function createStyles(theme: Theme) {
    return StyleSheet.create({
        modalContainer: {
            width: 420,
            maxWidth: 480,
            backgroundColor: theme.colors.PrimaryBackground,
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
            color: theme.colors.ActiveText,
        },
        body: {
            marginBottom: 16,
        },
        bodyText: {
            fontSize: 14,
            color: theme.colors.MainText,
            marginBottom: 16,
        },
        messagePreview: {
            backgroundColor: theme.colors.SecondaryBackground,
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
            color: theme.colors.ActiveText,
            fontSize: 14,
        },
        timestampText: {
            fontSize: 12,
            color: theme.colors.InactiveText,
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
            color: theme.colors.InactiveText,
            fontSize: 14,
        },
        deleteButton: {
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 4,
            backgroundColor: theme.colors.Error,
        },
        deleteButtonText: {
            fontSize: 14,
            fontWeight: 'bold',
            color: theme.colors.ActiveText,
        },
    });
}
