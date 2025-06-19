// PostMoreOptionsMenu.tsx
import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Edit, Delete, Flair, NSFW, Spoiler } from '../icons';
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

// Example: Copy Text
export const CopyTextIconPost = ({ theme }: { theme: Theme }) => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
            d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zM19 5H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2z"
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

export const SaveIconPost = ({ theme }: { theme: Theme }) => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
            d="M6 4h12l2 2v14l-2 2H6l-2-2V6l2-2z"
            fill={theme.colors.ActiveText}
        />
    </Svg>
);
export const HideIconPost = ({ theme }: { theme: Theme }) => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
            d="M12 4c-7 0-10 8-10 8s3 8 10 8 10-8 10-8-3-8-10-8zm0 14a6 6 0 1 1 0-12 6 6 0 0 1 0 12z"
            fill={theme.colors.ActiveText}
        />
    </Svg>
);
export const AffiliateIconPost = ({ theme }: { theme: Theme }) => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2l4 20-8 0 4-20z" fill={theme.colors.ActiveText} />
    </Svg>
);
export const BellOffIconPost = ({ theme }: { theme: Theme }) => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
            d="M18 8a6 6 0 0 0-12 0v4H4l1 1h14l1-1h-2V8zM6 20h12v-2H6v2zm12-2h2v-2h-2v2z"
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
    onAddReaction: () => void;
    onCopyText: () => void;
    onCopyMessageLink: () => void;
    onDeleteMessage: () => void;

    onEditFlair: () => void;
    onSave: () => void;
    onHide: () => void;
    onAddSpoilerTag: () => void;
    onAddNSFWTag: () => void;
    onToggleReplyNotifications: () => void;
};

export function PostMoreOptionsMenu({
    visible,
    onClose,
    anchorPosition,
    onEdit,
    onReply,
    onForward,
    onAddReaction,
    onCopyText,
    onCopyMessageLink,
    onDeleteMessage,
    onEditFlair,
    onSave,
    onHide,
    onAddSpoilerTag,
    onAddNSFWTag,
    onToggleReplyNotifications,
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
                    <Edit size={22} />
                    <Text style={styles.menuItemText}>Edit Post</Text>
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

                {/* Copy Text */}
                <TouchableOpacity style={styles.menuItem} onPress={onCopyText}>
                    <CopyTextIconPost theme={theme} />
                    <Text style={styles.menuItemText}>Copy Text</Text>
                </TouchableOpacity>

                {/* Copy Message Link */}
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={onCopyMessageLink}
                >
                    <CopyLinkIconPost theme={theme} />
                    <Text style={styles.menuItemText}>Copy Message Link</Text>
                </TouchableOpacity>

                {/* Edit Post Flair */}
                <TouchableOpacity style={styles.menuItem} onPress={onEditFlair}>
                    <Flair size={22} />
                    <Text style={styles.menuItemText}>Edit Post Flair</Text>
                </TouchableOpacity>

                {/* Save */}
                <TouchableOpacity style={styles.menuItem} onPress={onSave}>
                    <SaveIconPost theme={theme} />
                    <Text style={styles.menuItemText}>Save</Text>
                </TouchableOpacity>

                {/* Hide */}
                <TouchableOpacity style={styles.menuItem} onPress={onHide}>
                    <HideIconPost theme={theme} />
                    <Text style={styles.menuItemText}>Hide</Text>
                </TouchableOpacity>

                {/* Add Spoiler Tag */}
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={onAddSpoilerTag}
                >
                    <Spoiler size={22} />
                    <Text style={styles.menuItemText}>Add Spoiler Tag</Text>
                </TouchableOpacity>

                {/* Add NSFW Tag */}
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={onAddNSFWTag}
                >
                    <NSFW size={22} />
                    <Text style={styles.menuItemText}>Add NSFW Tag</Text>
                </TouchableOpacity>

                {/* Turn Off Reply Notifications */}
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={onToggleReplyNotifications}
                >
                    <BellOffIconPost theme={theme} />
                    <Text style={styles.menuItemText}>
                        Turn Off Reply Notifications
                    </Text>
                </TouchableOpacity>

                {/* Delete Message */}
                <TouchableOpacity
                    style={styles.menuItemDelete}
                    onPress={onDeleteMessage}
                >
                    <Delete size={24} />
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
