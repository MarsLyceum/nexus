// MessageOptionsBottomSheet.tsx
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { useTheme, Theme } from '../theme';
import { Edit, Delete } from '../icons';

export type MessageOptionsBottomSheetProps = {
    visible: boolean;
    onClose: () => void;
    onEdit: () => void;
    onReply: () => void;
    onForward: () => void;
    onCreateThread: () => void;
    onCopyText: () => void;
    onMarkUnread: () => void;
    onPinMessage: () => void;
    onApps: () => void;
    onMention: () => void;
    onCopyMessageLink: () => void;
    onRemoveEmbed: () => void;
    onDeleteMessage: () => void;
};

export function MessageOptionsBottomSheet({
    visible,
    onClose,
    onEdit,
    onReply,
    onForward,
    onCreateThread,
    onCopyText,
    onMarkUnread,
    onPinMessage,
    onApps,
    onMention,
    onCopyMessageLink,
    onRemoveEmbed,
    onDeleteMessage,
}: MessageOptionsBottomSheetProps) {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <BottomSheet visible={visible} onClose={onClose}>
            <View style={styles.reactionsRow}>
                <TouchableOpacity style={styles.reactionButton}>
                    <Text style={styles.reactionText}>👍</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.reactionButton}>
                    <Text style={styles.reactionText}>💯</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.reactionButton}>
                    <Text style={styles.reactionText}>😆</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.reactionButton}>
                    <Text style={styles.reactionText}>😐</Text>
                </TouchableOpacity>
            </View>
            <MenuItem
                label="Edit Message"
                icon={<Edit />}
                onPress={onEdit}
                theme={theme}
            />
            <MenuItem label="Reply" onPress={onReply} theme={theme} />
            <MenuItem label="Forward" onPress={onForward} theme={theme} />
            <MenuItem
                label="Create Thread"
                onPress={onCreateThread}
                theme={theme}
            />
            <MenuItem label="Copy Text" onPress={onCopyText} theme={theme} />
            <MenuItem
                label="Mark Unread"
                onPress={onMarkUnread}
                theme={theme}
            />
            <MenuItem
                label="Pin Message"
                onPress={onPinMessage}
                theme={theme}
            />
            <MenuItem label="Apps" onPress={onApps} theme={theme} />
            <MenuItem label="Mention" onPress={onMention} theme={theme} />
            <MenuItem
                label="Copy Message Link"
                onPress={onCopyMessageLink}
                theme={theme}
            />
            <View style={styles.destructiveContainer}>
                <MenuItem
                    label="Remove Embed"
                    onPress={onRemoveEmbed}
                    theme={theme}
                    destructive
                />
                <MenuItem
                    label="Delete Message"
                    icon={<Delete />}
                    onPress={onDeleteMessage}
                    theme={theme}
                    destructive
                />
            </View>
        </BottomSheet>
    );
}

export function MenuItem({
    label,
    icon,
    onPress,
    theme,
    destructive = false,
}: {
    label: string;
    icon?: React.ReactNode;
    onPress: () => void;
    theme: Theme;
    destructive?: boolean;
}) {
    const styles = useMemo(
        () => createMenuItemStyles(theme, destructive),
        [theme, destructive]
    );
    return (
        <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
            <View style={styles.iconContainer}>{icon}</View>
            <Text style={styles.labelText}>{label}</Text>
        </TouchableOpacity>
    );
}

function createStyles(theme: Theme) {
    return StyleSheet.create({
        reactionsRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
            paddingHorizontal: 16,
        },
        reactionButton: {
            marginRight: 12,
        },
        reactionText: {
            fontSize: 20,
            color: theme.colors.ActiveText,
        },
        destructiveContainer: {
            marginTop: 16,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.colors.InactiveText,
            paddingTop: 8,
            paddingHorizontal: 16,
            marginBottom: 32,
        },
    });
}

function createMenuItemStyles(theme: Theme, destructive: boolean) {
    return StyleSheet.create({
        itemContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.colors.InactiveText,
            backgroundColor: theme.colors.PrimaryBackground,
        },
        iconContainer: {
            marginRight: 12,
        },
        labelText: {
            fontSize: 15,
            color: destructive ? theme.colors.Error : theme.colors.ActiveText,
        },
    });
}
