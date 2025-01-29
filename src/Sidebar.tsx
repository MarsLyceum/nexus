import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NavigationProp } from '@react-navigation/core';

export const Sidebar = ({
    navigation,
}: Readonly<{
    navigation: NavigationProp<Record<string, unknown>>;
}>) => (
    <View style={{ flex: 1, padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Servers</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Server1')}>
            <Text style={{ marginVertical: 10 }}>Server 1</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Server2')}>
            <Text style={{ marginVertical: 10 }}>Server 2</Text>
        </TouchableOpacity>
    </View>
);
