import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NavigationProp } from '@react-navigation/core';

import { ChatButton, GroupButton } from './buttons';

export const Sidebar = ({
    navigation,
}: Readonly<{
    navigation: NavigationProp<Record<string, unknown>>;
}>) => (
    <View style={{ flex: 1, padding: 20, gap: 16 }}>
        <ChatButton onPress={() => {}} />

        <GroupButton
            onPress={() => navigation.navigate('Server1')}
            imageSource={require('./images/playstation_controller.jpg')}
        />
        <GroupButton
            onPress={() => navigation.navigate('Server2')}
            imageSource={require('./images/mario.jpg')}
        />
    </View>
);
