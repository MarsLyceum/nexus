import React from 'react';
import styled from 'styled-components/native';
import { ViewStyle, Pressable, View, StyleSheet } from 'react-native';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
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
        <Pressable onPress={() => {}}>
            <LinkText>Terms of Service</LinkText>
        </Pressable>
        <Pressable onPress={() => {}}>
            <LinkText>Privacy Policy</LinkText>
        </Pressable>
    </View>
);
