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
    Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useMutation } from '@apollo/client';
import { COLORS } from '../constants';
import { CREATE_GROUP_MUTATION } from '../queries';
import { useAppSelector, RootState, UserType } from '../redux';

/**
 * Helper function to detect the MIME type from a file URI.
 * It uses the file extension to return a MIME type.
 */
function getMimeType(uri: string): string {
    const extension = uri.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'gif':
            return 'image/gif';
        case 'webp':
            return 'image/webp';
        default:
            return 'application/octet-stream';
    }
}

/**
 * Converts a data URL (base64) to a File object (for web).
 * @param dataUrl The data URL (e.g., "data:image/jpeg;base64,...")
 * @param filename The desired file name.
 */
function dataURLtoFile(dataUrl: string, filename: string): File {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
        throw new Error('Invalid data URL');
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {
        type: mime,
        lastModified: Date.now(),
    });
}

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
    const [groupAvatar, setGroupAvatar] = useState<string | null>(null);
    const [isPublic, setIsPublic] = useState<boolean>(true);
    const user: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );

    const [createGroup, { loading }] = useMutation(CREATE_GROUP_MUTATION);

    // Launch the image picker.
    const handleUploadAvatar = async () => {
        const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permission required',
                'Permission to access media library is required!'
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
            base64: Platform.OS === 'web', // request base64 on web
        });

        const canceled =
            ('canceled' in result && result.canceled) ||
            ('cancelled' in result && result.cancelled);
        if (canceled) {
            return;
        }

        // Expo’s new API returns an assets array.
        const imageAsset = result.assets ? result.assets[0] : result;

        if (Platform.OS === 'web') {
            // On web, if base64 is provided, construct a data URL.
            if (imageAsset.base64) {
                const mimeType = getMimeType(imageAsset.uri);
                const dataUrl = `data:${mimeType};base64,${imageAsset.base64}`;
                setGroupAvatar(dataUrl);
            } else {
                setGroupAvatar(imageAsset.uri);
            }
        } else {
            // On native, simply store the URI.
            setGroupAvatar(imageAsset.uri);
        }
    };

    // Call the mutation when "Create" is pressed.
    const handleCreateGroup = async () => {
        if (groupName.trim() === '') {
            Alert.alert('Validation', 'Please enter a group name.');
            return;
        }
        if (!groupAvatar) {
            Alert.alert('Validation', 'Please upload an avatar.');
            return;
        }

        try {
            let fileUpload: File | { uri: string; type: string; name: string };

            if (Platform.OS !== 'web') {
                // For native, create an object with the file details.
                const fileName = groupAvatar.split('/').pop() || 'upload';
                const mimeType = getMimeType(fileName);
                fileUpload = {
                    uri: groupAvatar,
                    type: mimeType,
                    name: fileName,
                };
            } else {
                // Web: if groupAvatar is a data URL, convert it to a File.
                if (groupAvatar.startsWith('data:')) {
                    const fileName =
                        'upload.' + getMimeType(groupAvatar).split('/')[1];
                    fileUpload = dataURLtoFile(groupAvatar, fileName);
                } else {
                    // Otherwise, fetch the URL and convert to a File.
                    const response = await fetch(groupAvatar);
                    const blob = await response.blob();
                    const fileName = groupAvatar.split('/').pop() || 'upload';
                    const mimeType = blob.type || getMimeType(groupAvatar);
                    fileUpload = new File([blob], fileName, {
                        type: mimeType,
                        lastModified: Date.now(),
                    });
                }
            }

            // Now call the mutation.
            // We add the header 'x-apollo-operation-name' to satisfy CSRF checks.
            const { data } = await createGroup({
                variables: {
                    name: groupName,
                    createdByUserId: user?.id,
                    publicGroup: isPublic,
                    avatar: fileUpload,
                },
                context: {
                    headers: {
                        'x-apollo-operation-name': 'CreateGroup',
                    },
                },
            });
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
                    {groupAvatar ? (
                        <Image
                            source={{ uri: groupAvatar }}
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
