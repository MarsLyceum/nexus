// PostMoreOptionsMenu.tsx
import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Edit, Delete } from '../icons';
import { useTheme, Theme } from '../theme';

import { MiniModal } from './MiniModal';

/* Inline definitions for missing icons using TS.
   These are placeholder paths—replace them with
   the correct coordinates for your actual SVGs. */

// Example: Reply
export const ReplyIconPost = ({ theme }: { theme: Theme }) => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
            d="M2 12l8-7v4h6c3.31 0 6 2.69 6 6v5l-3.5-3.5c-.88-.88-2.06-1.4-3.5-1.4H10v4l-8-7z"
            fill={theme.colors.ActiveText}
        />
    </Svg>
);

// Example: Forward
export const ForwardIconPost = ({ theme }: { theme: Theme }) => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
            d="M22 12l-8 7v-4h-6c-3.31 0-6-2.69-6-6V4l3.5 3.5c.88.88 2.06 1.4 3.5 1.4h5v-4l8 7z"
            fill={theme.colors.ActiveText}
        />
    </Svg>
);

// Example: Thread
export const ThreadIconPost = ({ theme }: { theme: Theme }) => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
            d="M4 4h16v10H5.17L4 15.17V4zM2 2v16l4-4h14c1.1 0 2-.9 2-2V2H2z"
            fill={theme.colors.ActiveText}
        />
    </Svg>
);

// Example: Copy Text
export const CopyTextIconPost = ({ theme }: { theme: Theme }) => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
            d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zM19 5H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2z"
            fill={theme.colors.ActiveText}
        />
    </Svg>
);

// Example: Pin Message
export const PinMessageIconPost = ({ theme }: { theme: Theme }) => (
    <Svg width={18} height={18} viewBox="0 0 512 512" fill="none">
        <Path
            d="M128 128l256 0 0 128 64-64-128 128v64l-64-64-128 0 0-192z"
            fill={theme.colors.ActiveText}
        />
    </Svg>
);

// Example: Mark Unread
export const MarkUnreadIconPost = ({ theme }: { theme: Theme }) => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
            d="M18 8V6H2v12h14v-2H4V8h14zM20 4h-2v6l-2.5-2.5-1.42 1.42L18 13.84l4.5-4.92-1.42-1.4L20 10V4z"
            fill={theme.colors.ActiveText}
        />
    </Svg>
);

// Example: Copy Message Link
export const CopyLinkIconPost = ({ theme }: { theme: Theme }) => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
            d="M3.9 12c0-1.16.94-2.1 2.1-2.1h4V8H6c-2.16 0-3.9 1.74-3.9 3.9v0c0 2.16 1.74 3.9 3.9 3.9h4v-1.9H6c-1.16 0-2.1-.94-2.1-2.1zm8.1 0v0c0-1.16.94-2.1 2.1-2.1h4V8h-4c-2.16 0-3.9 1.74-3.9 3.9v0c0 2.16 1.74 3.9 3.9 3.9h4v-1.9h-4c-1.16 0-2.1-.94-2.1-2.1z"
            fill={theme.colors.ActiveText}
        />
    </Svg>
);

/* We define this type to ensure we stay with TypeScript (not an interface). */
export type PostMoreOptionsMenuProps = {
    visible: boolean;
    onClose: () => void;
    anchorPosition?: { x: number; y: number; width: number; height: number };
    onEdit: () => void;
    onReply: () => void;
    onForward: () => void;
    onCreateThread: () => void;
    onAddReaction: () => void;
    onCopyText: () => void;
    onPinMessage: () => void;
    onMarkUnread: () => void;
    onCopyMessageLink: () => void;
    onDeleteMessage: () => void;
};

export function PostMoreOptionsMenu({
    visible,
    onClose,
    anchorPosition,
    onEdit,
    onReply,
    onForward,
    onCreateThread,
    onAddReaction,
    onCopyText,
    onPinMessage,
    onMarkUnread,
    onCopyMessageLink,
    onDeleteMessage,
}: PostMoreOptionsMenuProps) {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <MiniModal
            visible={visible}
            onClose={onClose}
            anchorPosition={anchorPosition}
            // Higher zIndex to ensure we're on top of any other modal
            containerStyle={[styles.modalContainer, { zIndex: 9999 }]}
            closeOnOutsideClick
        >
            <View style={styles.menuContainer}>
                {/* Add Reaction */}
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={onAddReaction}
                >
                    <Text style={styles.menuItemText}>Add Reaction</Text>
                </TouchableOpacity>

                {/* Edit Message */}
                <TouchableOpacity style={styles.menuItem} onPress={onEdit}>
                    <Edit />
                    <Text style={styles.menuItemText}>Edit Message</Text>
                </TouchableOpacity>

                {/* Reply */}
                <TouchableOpacity style={styles.menuItem} onPress={onReply}>
                    <ReplyIconPost theme={theme} />
                    <Text style={styles.menuItemText}>Reply</Text>
                </TouchableOpacity>

                {/* Forward */}
                <TouchableOpacity style={styles.menuItem} onPress={onForward}>
                    <ForwardIconPost theme={theme} />
                    <Text style={styles.menuItemText}>Forward</Text>
                </TouchableOpacity>

                {/* Create Thread */}
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={onCreateThread}
                >
                    <ThreadIconPost theme={theme} />
                    <Text style={styles.menuItemText}>Create Thread</Text>
                </TouchableOpacity>

                {/* Copy Text */}
                <TouchableOpacity style={styles.menuItem} onPress={onCopyText}>
                    <CopyTextIconPost theme={theme} />
                    <Text style={styles.menuItemText}>Copy Text</Text>
                </TouchableOpacity>

                {/* Pin Message */}
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={onPinMessage}
                >
                    <PinMessageIconPost theme={theme} />
                    <Text style={styles.menuItemText}>Pin Message</Text>
                </TouchableOpacity>

                {/* Mark Unread */}
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={onMarkUnread}
                >
                    <MarkUnreadIconPost theme={theme} />
                    <Text style={styles.menuItemText}>Mark Unread</Text>
                </TouchableOpacity>

                {/* Copy Message Link */}
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={onCopyMessageLink}
                >
                    <CopyLinkIconPost theme={theme} />
                    <Text style={styles.menuItemText}>Copy Message Link</Text>
                </TouchableOpacity>

                {/* Delete Message */}
                <TouchableOpacity
                    style={styles.menuItemDelete}
                    onPress={onDeleteMessage}
                >
                    <Delete />
                    <Text style={[styles.menuItemText, styles.deleteText]}>
                        Delete Message
                    </Text>
                </TouchableOpacity>
            </View>
        </MiniModal>
    );
}

function createStyles(theme: Theme) {
    return StyleSheet.create({
        modalContainer: {
            backgroundColor: theme.colors.PrimaryBackground,
            borderRadius: 8,
            paddingVertical: 6,
            paddingHorizontal: 8,
            shadowColor: theme.colors.InactiveText,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
        },
        menuContainer: {
            // Additional styling for menu layout
        },
        menuItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
        },
        menuItemDelete: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            backgroundColor: 'rgba(187, 24, 23, 0.1)', // or use theme.colors.Error with transparency
        },
        menuItemText: {
            marginLeft: 6,
            fontSize: 15,
            color: theme.colors.ActiveText,
        },
        deleteText: {
            color: theme.colors.Error,
        },
    });
}
