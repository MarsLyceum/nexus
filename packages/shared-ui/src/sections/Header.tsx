// Header.tsx
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'solito/router';

import { BackArrow } from '../buttons';

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
    headerText,
}: {
    isLargeScreen: boolean;
    headerText: string;
}) => {
    const { back } = useRouter();
    return (
        <View style={styles.header}>
            {!isLargeScreen && <BackArrow onPress={back} />}
            <Text style={styles.channelName}>{headerText}</Text>
        </View>
    );
};
