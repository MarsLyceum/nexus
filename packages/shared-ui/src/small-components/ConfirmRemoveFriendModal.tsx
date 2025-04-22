import React, { useMemo } from 'react';
import {
    Modal,
    View,
    Text,
    Pressable,
    Platform,
    StyleSheet,
} from 'react-native';
import { useTheme, Theme } from '../theme';

import { User, FriendItemData } from '../types';

type ConfirmationModalProps = {
    visible: boolean;
    friendToRemove?: FriendItemData;
    user?: User;
    onConfirm: () => void;
    onCancel: () => void;
};

export const ConfirmRemoveFriendModal: React.FC<ConfirmationModalProps> = ({
    visible,
    friendToRemove,
    user,
    onConfirm,
    onCancel,
}) => {
    const isCancelFriendRequest =
        friendToRemove &&
        friendToRemove.status?.toLowerCase() === 'pending' &&
        friendToRemove.requestedBy?.id === user?.id;

    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>
                        {isCancelFriendRequest
                            ? `Cancel Friend Request to ${friendToRemove?.friend?.username || 'this friend'}`
                            : `Remove ${friendToRemove?.friend?.username || 'this friend'}`}
                    </Text>
                    <Text style={styles.modalMessage}>
                        {isCancelFriendRequest
                            ? `Are you sure you want to cancel your friend request to ${friendToRemove?.friend?.username || 'this friend'}`
                            : `Are you sure you want to remove ${friendToRemove?.friend?.username || 'this friend'} from your friends?`}
                    </Text>
                    <Pressable
                        style={({ hovered }) => [
                            styles.modalButton,
                            styles.removeButton,
                            hovered &&
                                Platform.OS === 'web' && { cursor: 'pointer' },
                        ]}
                        onPress={onConfirm}
                    >
                        <Text style={styles.buttonText}>
                            {isCancelFriendRequest
                                ? 'Cancel Friend Request'
                                : 'Remove Friend'}
                        </Text>
                    </Pressable>
                    <Pressable
                        style={({ hovered }) => [
                            styles.modalButton,
                            styles.cancelButton,
                            hovered &&
                                Platform.OS === 'web' && { cursor: 'pointer' },
                        ]}
                        onPress={onCancel}
                    >
                        <Text style={styles.buttonText}>Nevermind</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

function createStyles(theme: Theme) {
    return StyleSheet.create({
        modalContainer: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        modalContent: {
            backgroundColor: theme.colors.PrimaryBackground,
            padding: 20,
            borderRadius: 8,
            alignItems: 'center',
            width: '80%',
        },
        modalTitle: {
            fontSize: 18,
            color: theme.colors.ActiveText,
            marginBottom: 10,
            textAlign: 'center',
        },
        modalMessage: {
            fontSize: 14,
            color: theme.colors.InactiveText,
            marginBottom: 20,
            textAlign: 'center',
        },
        modalButton: {
            marginVertical: 5,
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 4,
            width: '100%',
            alignItems: 'center',
        },
        removeButton: {
            backgroundColor: theme.colors.Error,
        },
        cancelButton: {
            backgroundColor: theme.colors.TextInput,
        },
        buttonText: {
            color: theme.colors.ActiveText,
            fontWeight: 'bold',
        },
    });
}
