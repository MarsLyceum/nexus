// src/screens/CreateGroupModal.tsx

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    Platform,
    TouchableOpacity,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        backgroundColor: Platform.OS === 'web' ? 'rgba(0,0,0,0.5)' : '#fff',
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 20,
    },
    closeButton: {
        marginTop: 20,
        alignSelf: 'center',
    },
    closeButtonText: {
        color: 'blue',
        fontSize: 16,
    },
});

type RootStackParamList = {
    CreateGroup: undefined; // Define other routes as needed
    // Example:
    // Welcome: undefined;
    // Login: undefined;
    // SignUp: undefined;
    // AppDrawer: undefined;
    // Chat: { user: { name: string; avatar: string } };
    // ServerMessages: { channel: string };
};

// 2. Define navigation and route props using the local RootStackParamList
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

    const handleCreateGroup = () => {
        if (groupName.trim() === '') {
            alert('Please enter a group name.');
            return;
        }

        // Implement your group creation logic here
        // For example, make an API call to create the group

        console.log('Group Created:', groupName);

        // After creating the group, navigate back or close the modal
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create New Group</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter group name"
                value={groupName}
                onChangeText={setGroupName}
            />
            <Button title="Create Group" onPress={handleCreateGroup} />
            {/* Close Button for Desktop/Laptop */}
            {Platform.OS !== 'ios' && Platform.OS !== 'android' && (
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};
