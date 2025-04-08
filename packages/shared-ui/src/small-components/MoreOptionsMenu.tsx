// MoreOptionsMenu.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MiniModal } from './MiniModal';
import { Tooltip } from './Tooltip';
import { Edit } from '../icons'; // Keep your existing Edit icon import
import { COLORS } from '../constants';

/* Inline definitions for missing icons using TS. 
   These are placeholder paths—replace them with
   the correct coordinates for your actual SVGs. */

// Example: Reply
export const ReplyIcon: React.FC = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
            d="M2 12l8-7v4h6c3.31 0 6 2.69 6 6v5l-3.5-3.5c-.88-.88-2.06-1.4-3.5-1.4H10v4l-8-7z"
            fill={COLORS.White}
        />
    </Svg>
);

// Example: Forward
export const ForwardIcon: React.FC = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
            d="M22 12l-8 7v-4h-6c-3.31 0-6-2.69-6-6V4l3.5 3.5c.88.88 2.06 1.4 3.5 1.4h5v-4l8 7z"
            fill={COLORS.White}
        />
    </Svg>
);

// Example: Thread
export const ThreadIcon: React.FC = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
            d="M4 4h16v10H5.17L4 15.17V4zM2 2v16l4-4h14c1.1 0 2-.9 2-2V2H2z"
            fill={COLORS.White}
        />
    </Svg>
);

// Example: Copy Text
export const CopyTextIcon: React.FC = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
            d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zM19 5H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2z"
            fill={COLORS.White}
        />
    </Svg>
);

// Example: Pin Message
export const PinMessageIcon: React.FC = () => (
    <Svg width={18} height={18} viewBox="0 0 512 512" fill="none">
        <Path
            d="M128 128l256 0 0 128 64-64-128 128v64l-64-64-128 0 0-192z"
            fill={COLORS.White}
        />
    </Svg>
);

// Example: Mark Unread
export const MarkUnreadIcon: React.FC = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
            d="M18 8V6H2v12h14v-2H4V8h14zM20 4h-2v6l-2.5-2.5-1.42 1.42L18 13.84l4.5-4.92-1.42-1.4L20 10V4z"
            fill={COLORS.White}
        />
    </Svg>
);

// Example: Copy Message Link
export const CopyLinkIcon: React.FC = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
            d="M3.9 12c0-1.16.94-2.1 2.1-2.1h4V8H6c-2.16 0-3.9 1.74-3.9 3.9v0c0 2.16 1.74 3.9 3.9 3.9h4v-1.9H6c-1.16 0-2.1-.94-2.1-2.1zm8.1 0v0c0-1.16.94-2.1 2.1-2.1h4V8h-4c-2.16 0-3.9 1.74-3.9 3.9v0c0 2.16 1.74 3.9 3.9 3.9h4v-1.9h-4c-1.16 0-2.1-.94-2.1-2.1z"
            fill={COLORS.White}
        />
    </Svg>
);

// Example: Delete
export const DeleteIcon: React.FC = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M9 3V4H4v2h16V4h-5V3H9zm1 14h2V9h-2v8z" fill={COLORS.Error} />
    </Svg>
);

/* We define this type to ensure we stay with TypeScript (not an interface). */
export type MoreOptionsMenuProps = {
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

export function MoreOptionsMenu({
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
}: MoreOptionsMenuProps) {
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
                <Tooltip tooltipText="Add Reaction">
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={onAddReaction}
                    >
                        <Text style={styles.menuItemText}>Add Reaction</Text>
                    </TouchableOpacity>
                </Tooltip>

                {/* Edit Message */}
                <Tooltip tooltipText="Edit Message">
                    <TouchableOpacity style={styles.menuItem} onPress={onEdit}>
                        <Edit />
                        <Text style={styles.menuItemText}>Edit Message</Text>
                    </TouchableOpacity>
                </Tooltip>

                {/* Reply */}
                <Tooltip tooltipText="Reply">
                    <TouchableOpacity style={styles.menuItem} onPress={onReply}>
                        <ReplyIcon />
                        <Text style={styles.menuItemText}>Reply</Text>
                    </TouchableOpacity>
                </Tooltip>

                {/* Forward */}
                <Tooltip tooltipText="Forward">
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={onForward}
                    >
                        <ForwardIcon />
                        <Text style={styles.menuItemText}>Forward</Text>
                    </TouchableOpacity>
                </Tooltip>

                {/* Create Thread */}
                <Tooltip tooltipText="Create Thread">
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={onCreateThread}
                    >
                        <ThreadIcon />
                        <Text style={styles.menuItemText}>Create Thread</Text>
                    </TouchableOpacity>
                </Tooltip>

                {/* Copy Text */}
                <Tooltip tooltipText="Copy Text">
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={onCopyText}
                    >
                        <CopyTextIcon />
                        <Text style={styles.menuItemText}>Copy Text</Text>
                    </TouchableOpacity>
                </Tooltip>

                {/* Pin Message */}
                <Tooltip tooltipText="Pin Message">
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={onPinMessage}
                    >
                        <PinMessageIcon />
                        <Text style={styles.menuItemText}>Pin Message</Text>
                    </TouchableOpacity>
                </Tooltip>

                {/* Mark Unread */}
                <Tooltip tooltipText="Mark Unread">
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={onMarkUnread}
                    >
                        <MarkUnreadIcon />
                        <Text style={styles.menuItemText}>Mark Unread</Text>
                    </TouchableOpacity>
                </Tooltip>

                {/* Copy Message Link */}
                <Tooltip tooltipText="Copy Message Link">
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={onCopyMessageLink}
                    >
                        <CopyLinkIcon />
                        <Text style={styles.menuItemText}>
                            Copy Message Link
                        </Text>
                    </TouchableOpacity>
                </Tooltip>

                {/* Delete Message */}
                <Tooltip tooltipText="Delete Message">
                    <TouchableOpacity
                        style={styles.menuItemDelete}
                        onPress={onDeleteMessage}
                    >
                        <DeleteIcon />
                        <Text style={[styles.menuItemText, styles.deleteText]}>
                            Delete Message
                        </Text>
                    </TouchableOpacity>
                </Tooltip>
            </View>
        </MiniModal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        backgroundColor: COLORS.PrimaryBackground,
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 8,
        shadowColor: COLORS.InactiveText,
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
        backgroundColor: 'rgba(187, 24, 23, 0.1)', // or use COLORS.Error with transparency
    },
    menuItemText: {
        marginLeft: 6,
        fontSize: 15,
        color: COLORS.White,
    },
    deleteText: {
        color: COLORS.Error,
    },
});
