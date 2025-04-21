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
                { width: Math.min(440, viewportWidth - 32) },
            ]}
            layout="below right"
            gap={20}
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Select Friends</Text>
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
                            <NexusImage
                                source={`https://picsum.photos/seed/${friend.username}/40`}
                                width={32}
                                height={32}
                                style={styles.avatar}
                                alt={`${friend.username} avatar`}
                            />
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
        container: {
            backgroundColor: theme.colors.TertiaryBackground,
            borderRadius: 8,
            padding: 16,
        },
        header: {
            marginBottom: 12,
        },
        title: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.ActiveText,
            fontFamily: 'Roboto_700Bold',
        },
        caption: {
            fontSize: 12,
            color: theme.colors.InactiveText,
            marginTop: 2,
        },
        searchInput: {
            backgroundColor: theme.colors.TextInput,
            borderRadius: 6,
            paddingVertical: 6,
            paddingHorizontal: 10,
            fontSize: 14,
            color: theme.colors.ActiveText,
            marginBottom: 12,
        },
        list: {
            marginBottom: 12,
        },
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 6,
            paddingHorizontal: 8,
            borderRadius: 4,
        },
        rowPressed: {
            backgroundColor: theme.colors.SecondaryBackground,
        },
        avatar: {
            borderRadius: 16,
            marginRight: 10,
        },
        textCol: {
            flex: 1,
        },
        displayName: {
            color: theme.colors.ActiveText,
            fontSize: 14,
            fontWeight: 'bold',
            fontFamily: 'Roboto_700Bold',
        },
        userName: {
            color: theme.colors.InactiveText,
            fontSize: 12,
        },
        checkbox: {
            width: 18,
            height: 18,
            borderWidth: 2,
            borderColor: theme.colors.InactiveText,
            borderRadius: 4,
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
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 4,
        },
        createBtnDisabled: {
            opacity: 0.4,
        },
        createBtnTxt: {
            color: theme.colors.ActiveText,
            fontSize: 14,
            fontWeight: 'bold',
            fontFamily: 'Roboto_700Bold',
        },
    });
}
