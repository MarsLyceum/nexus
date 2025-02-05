import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { NavigationProp } from '@react-navigation/core';
import { BackArrow } from '../buttons';
import { GroupChannel } from '../types';

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#4A3A5A',
    },
    channelName: {
        fontSize: 18,
        color: 'white',
        fontWeight: 'bold',
    },
});

export const Header = ({
    isLargeScreen,
    channel,
    navigation,
}: {
    isLargeScreen: boolean;
    channel: GroupChannel;
    navigation: NavigationProp<Record<string, unknown>>;
}) => (
    <View style={styles.header}>
        {!isLargeScreen && <BackArrow onPress={() => navigation.goBack()} />}
        <Text style={styles.channelName}>{channel.name}</Text>
    </View>
);
