import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, TouchableOpacity } from 'react-native';

const Stack = createStackNavigator();

// Dummy Channel List
const ChannelList = ({ navigation }) => {
    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Channels</Text>
            <TouchableOpacity
                onPress={() =>
                    navigation.navigate('Chat', { channel: 'general' })
                }
            >
                <Text style={{ marginVertical: 10 }}># general</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() =>
                    navigation.navigate('Chat', { channel: 'random' })
                }
            >
                <Text style={{ marginVertical: 10 }}># random</Text>
            </TouchableOpacity>
        </View>
    );
};

// Dummy Chat Screen
const ChatScreen = ({ route }) => {
    return (
        <View
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
            <Text>Chat for #{route.params.channel}</Text>
        </View>
    );
};

export function ServerScreen() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Channels" component={ChannelList} />
            <Stack.Screen name="Chat" component={ChatScreen} />
        </Stack.Navigator>
    );
}
