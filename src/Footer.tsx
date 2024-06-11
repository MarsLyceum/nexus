import React from 'react';
import styled from 'styled-components/native';
import { ViewStyle, TouchableOpacity, View, StyleSheet } from 'react-native';

const LinkText = styled.Text`
    color: #a63fa3;
    font-size: 14px;
    font-weight: regular;
    margin: 0 10px;
`;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        margin: 20,
    },
});

export const Footer = ({ style }: { style?: ViewStyle | ViewStyle[] }) => (
    <View style={[styles.container, style]}>
        <TouchableOpacity onPress={() => {}}>
            <LinkText>Terms of Service</LinkText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {}}>
            <LinkText>Privacy Policy</LinkText>
        </TouchableOpacity>
    </View>
);
