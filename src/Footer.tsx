import React from 'react';
import styled from 'styled-components/native';
import { ViewStyle } from 'react-native';

const Container = styled.View`
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin: 20px;
`;

const LinkText = styled.Text`
    color: #a63fa3;
    font-size: 14px;
    font-weight: regular;
    margin: 0 10px;
`;

export const Footer = ({ style }: { style?: ViewStyle | ViewStyle[] }) => (
    <Container style={style}>
        <LinkText>Terms of Service</LinkText>
        <LinkText>Privacy Policy</LinkText>
    </Container>
);
