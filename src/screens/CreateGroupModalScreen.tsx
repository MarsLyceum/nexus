// src/screens/CreateGroupModal.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    Image,
    Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useMutation } from '@apollo/client';
import { COLORS } from '../constants';
import { CREATE_GROUP_MUTATION } from '../queries';
import { useAppSelector, RootState, UserType } from '../redux';
import { useFileUpload } from '../hooks/useFileUpload';

type RootStackParamList = {
    CreateGroup: undefined;
};

type CreateGroupModalNavigationProp = StackNavigationProp<
    RootStackParamList,
    'CreateGroup'
>;
type CreateGroupModalRouteProp = RouteProp<RootStackParamList, 'CreateGroup'>;

type Props = {
    navigation: CreateGroupModalNavigationProp;
    route: CreateGroupModalRouteProp;
};

export const CreateGroupModalScreen: React.FC<Props> = ({ navigation }) => {
    const [groupName, setGroupName] = useState<string>('');
    const [isPublic, setIsPublic] = useState<boolean>(true);
    // We'll store the processed file (for mutation) in this state.
    const [avatarFile, setAvatarFile] = useState<
        File | { uri: string; type: string; name: string } | undefined
    >();

    const user: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );

    const [createGroup, { loading }] = useMutation(CREATE_GROUP_MUTATION);

    // Use the custom hook for file uploads.
    const { fileData, pickFile } = useFileUpload();

    // Handler to launch the file picker and store the result.
    const handleUploadAvatar = async () => {
        const file = await pickFile();
        if (!file) return;
        setAvatarFile(file);
    };

    // Handler to create a new group using the stored avatar file.
    const handleCreateGroup = async () => {
        if (groupName.trim() === '') {
            Alert.alert('Validation', 'Please enter a group name.');
            return;
        }
        if (!avatarFile) {
            Alert.alert('Validation', 'Please upload an avatar.');
            return;
        }

        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const { data } = await createGroup({
                variables: {
                    name: groupName,
                    createdByUserId: user?.id,
                    publicGroup: isPublic,
                    avatar: avatarFile,
                },
                context: {
                    headers: {
                        'x-apollo-operation-name': 'CreateGroup',
                    },
                },
            });
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            console.log('Group Created:', data.createGroup.name);
            navigation.goBack();
        } catch (error) {
            console.error('Error creating group:', error);
            Alert.alert('Error', 'Failed to create group.');
        }
    };

    return (
        <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Create New Group</Text>

                <View style={styles.groupAvatarContainer}>
                    {fileData ? (
                        <Image
                            source={{ uri: fileData }}
                            style={styles.groupAvatar}
                        />
                    ) : (
                        <View style={styles.placeholderAvatar}>
                            <Text style={styles.placeholderAvatarText}>
                                No Avatar
                            </Text>
                        </View>
                    )}
                    <Pressable
                        style={styles.uploadButton}
                        onPress={handleUploadAvatar}
                    >
                        <Text style={styles.uploadButtonText}>
                            Upload Avatar
                        </Text>
                    </Pressable>
                </View>

                <View style={styles.privacyContainer}>
                    <Text style={styles.privacyLabel}>Privacy:</Text>
                    <View style={styles.privacyOptions}>
                        <Pressable
                            style={[
                                styles.privacyOption,
                                isPublic && styles.selectedPrivacyOption,
                            ]}
                            onPress={() => setIsPublic(true)}
                        >
                            <Text style={styles.privacyOptionText}>Public</Text>
                        </Pressable>
                        <Pressable
                            style={[
                                styles.privacyOption,
                                !isPublic && styles.selectedPrivacyOption,
                            ]}
                            onPress={() => setIsPublic(false)}
                        >
                            <Text style={styles.privacyOptionText}>
                                Private
                            </Text>
                        </Pressable>
                    </View>
                </View>

                <TextInput
                    style={styles.textInput}
                    placeholder="Enter group name"
                    placeholderTextColor={COLORS.InactiveText}
                    value={groupName}
                    onChangeText={setGroupName}
                />

                <View style={styles.modalButtonRow}>
                    <Pressable
                        style={styles.modalButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.modalButtonText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                        style={styles.modalButton}
                        onPress={handleCreateGroup}
                        disabled={loading}
                    >
                        <Text style={styles.modalButtonText}>
                            {loading ? 'Creating...' : 'Create'}
                        </Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '85%',
        backgroundColor: COLORS.AppBackground,
        borderRadius: 8,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
        color: COLORS.White,
    },
    textInput: {
        borderWidth: 1,
        borderColor: COLORS.InactiveText,
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
        color: COLORS.White,
        backgroundColor: COLORS.TextInput,
    },
    modalButtonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    modalButton: {
        marginLeft: 10,
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
        backgroundColor: COLORS.Primary,
    },
    modalButtonText: {
        color: COLORS.White,
        fontWeight: '600',
    },
    groupAvatarContainer: {
        alignItems: 'center',
        marginBottom: 15,
    },
    groupAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    placeholderAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.InactiveText,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderAvatarText: {
        color: COLORS.White,
    },
    uploadButton: {
        marginTop: 10,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 5,
        backgroundColor: COLORS.Primary,
    },
    uploadButtonText: {
        color: COLORS.White,
    },
    privacyContainer: {
        marginBottom: 15,
    },
    privacyLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.White,
        marginBottom: 5,
    },
    privacyOptions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    privacyOption: {
        flex: 1,
        paddingVertical: 8,
        marginHorizontal: 5,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: COLORS.InactiveText,
        alignItems: 'center',
    },
    selectedPrivacyOption: {
        backgroundColor: COLORS.Primary,
    },
    privacyOptionText: {
        color: COLORS.White,
        fontWeight: '600',
    },
});
