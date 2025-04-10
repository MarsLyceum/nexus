import React from 'react';
import {
    Modal,
    View,
    Text,
    Pressable,
    Platform,
    StyleSheet,
} from 'react-native';
import { COLORS } from '../constants';

import { User } from '../types';

import { FriendItemData } from './FriendItem';

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

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: COLORS.PrimaryBackground,
        padding: 20,
        borderRadius: 8,
        alignItems: 'center',
        width: '80%',
    },
    modalTitle: {
        fontSize: 18,
        color: COLORS.White,
        marginBottom: 10,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 14,
        color: COLORS.InactiveText,
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
        backgroundColor: COLORS.Error,
    },
    cancelButton: {
        backgroundColor: COLORS.TextInput,
    },
    buttonText: {
        color: COLORS.White,
        fontWeight: 'bold',
    },
});
