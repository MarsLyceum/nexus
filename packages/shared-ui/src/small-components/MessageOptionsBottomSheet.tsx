// MessageOptionsBottomSheet.tsx
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme, Theme } from '../theme';
import { Edit, Delete, Cancel } from '../icons';

import { BottomSheet } from './BottomSheet';

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
                {['👍', '💯', '😆', '😐'].map((emoji) => (
                    <TouchableOpacity key={emoji} style={styles.reactionButton}>
                        <Text style={styles.reactionText}>{emoji}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* ───── Primary Actions ───── */}
            <View style={styles.sectionTop}>
                <MenuItem
                    label="Edit Message"
                    icon={<Edit color={theme.colors.ActiveText} />}
                    onPress={onEdit}
                    theme={theme}
                />
                <MenuItem
                    label="Reply"
                    icon={<ReplyIcon color={theme.colors.ActiveText} />}
                    onPress={onReply}
                    theme={theme}
                />
                <MenuItem
                    label="Forward"
                    icon={<ForwardIcon color={theme.colors.ActiveText} />}
                    onPress={onForward}
                    theme={theme}
                />
                <MenuItem
                    label="Create Thread"
                    icon={<ThreadIcon color={theme.colors.ActiveText} />}
                    onPress={onCreateThread}
                    theme={theme}
                />
            </View>

            {/* ───── Secondary Actions ───── */}
            <View style={styles.sectionMiddle}>
                <MenuItem
                    label="Copy Text"
                    icon={<CopyIcon color={theme.colors.ActiveText} />}
                    onPress={onCopyText}
                    theme={theme}
                />
                <MenuItem
                    label="Mark Unread"
                    icon={<MailIcon color={theme.colors.ActiveText} />}
                    onPress={onMarkUnread}
                    theme={theme}
                />
                <MenuItem
                    label="Pin Message"
                    icon={<PinIcon color={theme.colors.ActiveText} />}
                    onPress={onPinMessage}
                    theme={theme}
                />
                <MenuItem
                    label="Apps"
                    icon={<AppsIcon color={theme.colors.ActiveText} />}
                    onPress={onApps}
                    theme={theme}
                />
                <MenuItem
                    label="Mention"
                    icon={<MentionIcon color={theme.colors.ActiveText} />}
                    onPress={onMention}
                    theme={theme}
                />
                <MenuItem
                    label="Copy Message Link"
                    icon={<LinkIcon color={theme.colors.ActiveText} />}
                    onPress={onCopyMessageLink}
                    theme={theme}
                />
            </View>

            {/* ───── Destructive Actions ───── */}
            <View style={styles.sectionBottom}>
                <MenuItem
                    label="Remove Embed"
                    icon={<Cancel color={theme.colors.Error} />}
                    onPress={onRemoveEmbed}
                    theme={theme}
                    destructive
                />
                <MenuItem
                    label="Delete Message"
                    icon={<Delete color={theme.colors.Error} />}
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
    icon: React.ReactNode;
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

// -----------------------
// Inline SVG icon components
// -----------------------

function ReplyIcon({ size = 20, color }: { size?: number; color: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M10 14l-6-6 6-6"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M4 8h16a4 4 0 0 1 4 4v8"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function ForwardIcon({ size = 20, color }: { size?: number; color: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M14 10l6 6-6 6"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M20 16H4a4 4 0 0 1-4-4V4"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function ThreadIcon({ size = 20, color }: { size?: number; color: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function CopyIcon({ size = 20, color }: { size?: number; color: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M16 16H6V6h10v10z"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M18 18H8V8h10v10z"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function MailIcon({ size = 20, color }: { size?: number; color: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M4 4h16v16H4V4z"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M4 4l8 8 8-8"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function PinIcon({ size = 20, color }: { size?: number; color: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 2v20"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M5 15l7-7 7 7"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function AppsIcon({ size = 20, color }: { size?: number; color: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M3 3h8v8H3z" stroke={color} strokeWidth={2} />
            <Path d="M13 3h8v8h-8z" stroke={color} strokeWidth={2} />
            <Path d="M3 13h8v8H3z" stroke={color} strokeWidth={2} />
            <Path d="M13 13h8v8h-8z" stroke={color} strokeWidth={2} />
        </Svg>
    );
}

function MentionIcon({ size = 20, color }: { size?: number; color: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M16 12v2a6 6 0 1 1-12 0v-2"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function LinkIcon({ size = 20, color }: { size?: number; color: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M10 14a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1a5 5 0 0 1-7 0z"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M14 10l-1 1"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

// -----------------------
// Styles
// -----------------------

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
        sectionTop: {
            marginHorizontal: 16,
            backgroundColor: theme.colors.SecondaryBackground,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
            overflow: 'hidden',
        },
        sectionMiddle: {
            marginHorizontal: 16,
            marginTop: 32,
            backgroundColor: theme.colors.SecondaryBackground,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
            overflow: 'hidden',
        },
        sectionBottom: {
            marginHorizontal: 16,
            marginTop: 32,
            backgroundColor: theme.colors.SecondaryBackground,
            borderRadius: 12,
            overflow: 'hidden',
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
            backgroundColor: 'transparent',
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.colors.InactiveText,
        },
        iconContainer: {
            width: 24,
            alignItems: 'center',
            marginRight: 12,
        },
        labelText: {
            fontSize: 15,
            color: destructive ? theme.colors.Error : theme.colors.ActiveText,
        },
    });
}
