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
import * as ImagePicker from 'expo-image-picker';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { createClient } from '@supabase/supabase-js';
import { COLORS } from '../constants'; // Adjust path if needed

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

// Initialize Supabase client
const supabaseUrl = 'https://zrgnvlobrohtrrqeajhy.supabase.co';
const supabaseAnonKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyZ252bG9icm9odHJycWVhamh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwODgzMjcsImV4cCI6MjA1MzY2NDMyN30.sfXfrw-_WGpxTl8C2TqLqG6Dgd6hUdN-wO3rwi9WMVc';
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

const uploadIconToSupabase = async (
    imageUri: string
): Promise<string | null> => {
    try {
        // Convert the image URI to a Blob.
        const response = await fetch(imageUri);
        const blob = await response.blob();

        const filePath = `${Date.now()}.jpg`;
        // Generate a unique file name (you might use a UUID here)
        const fileName = `group-avatars/${filePath}`;

        // Upload the file to your Supabase bucket (change 'group-icons' to your bucket name)
        const { data, error } = await supabaseClient.storage
            .from('group-avatars')
            .upload(fileName, blob, {
                contentType: 'image/jpeg',
            });

        if (error) {
            console.error('Error uploading image:', error.message);
            return null;
        }

        // Get the public URL for the uploaded image.
        return filePath;
    } catch (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
    }
};

export const CreateGroupModalScreen: React.FC<Props> = ({ navigation }) => {
    const [groupName, setGroupName] = useState<string>('');
    const [groupAvatar, setGroupAvatar] = useState<string | null>(null);
    const [isPublic, setIsPublic] = useState<boolean>(true);

    // Function to launch the image picker for uploading an avatar
    const handleUploadAvatar = async () => {
        // Request permission to access the media library
        const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permission required',
                'Permission to access media library is required!'
            );
            return;
        }

        // Launch the image library with base64 enabled
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
            base64: true, // Ensure we get the base64 data on web
        });

        // Determine if the user canceled
        const canceled =
            ('canceled' in result && result.canceled) ||
            ('cancelled' in result && result.cancelled);
        if (canceled) {
            return;
        }

        // For the new API, the result will have an "assets" array
        const imageAsset = result.assets ? result.assets[0] : result;
        // If base64 is provided, use it to create a data URI; otherwise, use the uri.
        const imageUri = imageAsset.base64
            ? `data:image/jpeg;base64,${imageAsset.base64}`
            : imageAsset.uri;

        setGroupAvatar(imageUri);
    };

    const handleCreateGroup = async () => {
        if (groupName.trim() === '') {
            alert('Please enter a group name.');
            return;
        }

        await uploadIconToSupabase(groupAvatar ?? '');

        // Log or call your API to create the group with the provided details.
        console.log('Group Created:', {
            groupName,
            groupAvatar,
            privacy: isPublic ? 'Public' : 'Private',
        });

        // Close the modal after creation.
        navigation.goBack();
    };

    return (
        <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Create New Group</Text>

                {/* Group Avatar Section */}
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

                {/* Privacy Selection */}
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

                {/* Group Name Input */}
                <TextInput
                    style={styles.textInput}
                    placeholder="Enter group name"
                    placeholderTextColor={COLORS.InactiveText}
                    value={groupName}
                    onChangeText={setGroupName}
                />

                {/* Buttons */}
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
                    >
                        <Text style={styles.modalButtonText}>Create</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent background
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
