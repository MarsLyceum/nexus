import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { HeaderButton } from './HeaderButton';
import { ArrowLeft, Filters, Settings } from './icons';

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    location: {
        textAlign: 'center',
        fontSize: 16,
        color: '#A3A3A3',
        marginVertical: 8,
    },
    titleSubtitle: {
        marginLeft: 40,
        marginRight: 40,
    },
});

export function Header({
    title,
    subtitle,
}: {
    title: string;
    subtitle: string;
}) {
    const navigation = useNavigation();

    return (
        <View style={styles.header}>
            <HeaderButton onPress={() => navigation.goBack()}>
                <ArrowLeft />
            </HeaderButton>
            <View style={styles.titleSubtitle}>
                <Text style={styles.headerTitle}>{title}</Text>
                <Text style={styles.location}>{subtitle}</Text>
            </View>
            <HeaderButton onPress={() => {}}>
                <Filters />
            </HeaderButton>
            <HeaderButton onPress={() => {}}>
                <Settings />
            </HeaderButton>
        </View>
    );
}
