// SendMessageModal.tsx
import React, { useMemo, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    useWindowDimensions,
    Pressable,
} from 'react-native';

import { useTheme, Theme } from '../theme';
import { Friend } from '../types';
import { NexusButton } from '../buttons';
import { CheckMark } from '../icons';
import { getOnlineStatusDotColor } from '../utils';
import { BorderRadius, Spacing, Typography } from '../constants/designSystem';

import { MiniModal } from './MiniModal';
import { NexusImage } from './NexusImage';

export type SendMessageModalProps = {
    visible: boolean;
    onClose: () => void;
    onCreateDM: (friendIds: string[]) => void;
    anchorPosition?: { x: number; y: number; width: number; height: number };
    friends: Friend[];
};

export const SendMessageModal: React.FC<SendMessageModalProps> = ({
    visible,
    onClose,
    onCreateDM,
    friends,
    anchorPosition,
}) => {
    const { width: viewportWidth, height: viewportHeight } =
        useWindowDimensions();
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<string[]>([]);

    /** Filter friends by search text */
    const filteredFriends = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return friends;
        return friends.filter((f) => f.username?.toLowerCase().includes(q));
    }, [friends, search]);

    /** Toggle selection */
    const handleToggle = useCallback(
        (id: string) => {
            setSelected((prev) =>
                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
            );
        },
        [setSelected]
    );

    /** Confirm */
    const handleCreate = () => {
        if (selected.length === 0) return;
        onCreateDM(selected);
        setSelected([]);
        setSearch('');
        onClose();
    };

    /* roughly 60% of viewport height, hard‑clamped below */
    const maxListHeight = Math.min(viewportHeight * 0.6, 420);

    return (
        <MiniModal
            visible={visible}
            onClose={onClose}
            closeOnOutsideClick
            anchorPosition={anchorPosition}
            containerStyle={[
                styles.container,
                { width: Math.min(440, viewportWidth - Spacing.XXXL) },
            ]}
            layout="below right"
            gap={Spacing.XL}
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Select Friends to Message</Text>
            </View>

            {/* Search */}
            <TextInput
                placeholder="Type the username of a friend"
                placeholderTextColor={theme.colors.InactiveText}
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
            />

            {/* Friend list */}
            <ScrollView
                style={[styles.list, { maxHeight: maxListHeight }]}
                keyboardShouldPersistTaps="handled"
            >
                {filteredFriends.map((friend) => {
                    const isChecked = selected.includes(friend.id ?? '');
                    return (
                        <Pressable
                            key={friend.id}
                            onPress={() => handleToggle(friend.id ?? '')}
                            style={({ pressed }) => [
                                styles.row,
                                pressed && styles.rowPressed,
                            ]}
                        >
                            <View style={styles.avatarAndDot}>
                                <NexusImage
                                    source={`https://picsum.photos/seed/${friend.username}/40`}
                                    width={32}
                                    height={32}
                                    style={styles.avatar}
                                    alt={`${friend.username} avatar`}
                                />
                                <View
                                    style={[
                                        styles.statusDot,
                                        {
                                            backgroundColor:
                                                getOnlineStatusDotColor(
                                                    theme,
                                                    friend.status
                                                ),
                                        },
                                    ]}
                                />
                            </View>
                            <View style={styles.textCol}>
                                <Text style={styles.displayName}>
                                    {friend.username}
                                </Text>
                            </View>

                            {/* Checkbox */}
                            <View
                                style={[
                                    styles.checkbox,
                                    isChecked && styles.checkboxChecked,
                                ]}
                            >
                                {isChecked && (
                                    <CheckMark
                                        size={14}
                                        color={theme.colors.ActiveText}
                                    />
                                )}
                            </View>
                        </Pressable>
                    );
                })}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <NexusButton
                    label="Create Message"
                    onPress={handleCreate}
                    variant="filled"
                    disabled={selected.length === 0}
                />
            </View>
        </MiniModal>
    );
};

function createStyles(theme: Theme) {
    return StyleSheet.create({
        avatarAndDot: {
            position: 'relative',
            marginRight: Spacing.SM,
        },
        statusDot: {
            position: 'absolute',
            bottom: 0,
            right: Spacing.XS + 1,
            width: Spacing.LG - 1,
            height: Spacing.LG - 1,
            borderRadius: BorderRadius.ExtraSmall - 1,
            borderWidth: 2,
            borderColor: theme.colors.SecondaryBackground,
        },
        container: {
            backgroundColor: theme.colors.TertiaryBackground,
            borderRadius: BorderRadius.ExtraSmall,
            padding: Spacing.LG,
        },
        header: {
            marginBottom: Spacing.MD,
        },
        title: {
            ...Typography.SectionHeading,
            fontFamily: theme.fonts.primary?.bold,
            color: theme.colors.ActiveText,
        },
        caption: {
            ...Typography.Caption,
            fontFamily: theme.fonts.secondary?.regular,
            color: theme.colors.InactiveText,
            marginTop: Spacing.XS / 2,
        },
        searchInput: {
            ...Typography.Code,
            fontFamily: theme.fonts.primary?.regular,
            backgroundColor: theme.colors.TextInput,
            borderRadius: BorderRadius.ExtraSmall - 2,
            paddingVertical: Spacing.XS + 2,
            paddingHorizontal: Spacing.MD,
            color: theme.colors.ActiveText,
            marginBottom: Spacing.MD,
        },
        list: {
            marginBottom: Spacing.MD,
        },
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: Spacing.XS + 2,
            paddingHorizontal: Spacing.SM,
            borderRadius: BorderRadius.ExtraSmall - 4,
        },
        rowPressed: {
            backgroundColor: theme.colors.SecondaryBackground,
        },
        avatar: {
            borderRadius: BorderRadius.Medium,
            marginRight: Spacing.MD,
        },
        textCol: {
            flex: 1,
        },
        displayName: {
            ...Typography.Code,
            fontFamily: theme.fonts.primary?.bold,
            color: theme.colors.ActiveText,
        },
        userName: {
            ...Typography.Caption,
            fontFamily: theme.fonts.secondary?.regular,
            color: theme.colors.InactiveText,
        },
        checkbox: {
            width: Spacing.LG + 2,
            height: Spacing.LG + 2,
            borderWidth: 2,
            borderColor: theme.colors.InactiveText,
            borderRadius: BorderRadius.ExtraSmall - 4,
            justifyContent: 'center',
            alignItems: 'center',
        },
        checkboxChecked: {
            borderColor: theme.colors.Primary,
            backgroundColor: theme.colors.Primary,
        },
        footer: {
            alignItems: 'flex-end',
        },
        createBtn: {
            backgroundColor: theme.colors.Primary,
            paddingVertical: Spacing.MD,
            paddingHorizontal: Spacing.XL,
            borderRadius: BorderRadius.ExtraSmall - 4,
        },
        createBtnDisabled: {
            opacity: 0.4,
        },
        createBtnTxt: {
            ...Typography.Code,
            fontFamily: theme.fonts.primary?.bold,
            color: theme.colors.ActiveText,
        },
    });
}
