import React, { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { PeepsButton } from './PeepsButton';

const styles = StyleSheet.create({
    button: {
        width: 52,
        height: 52,
        left: '0%',
        right: '82.37%',
        top: '0%',
        bottom: '0%',
        backgroundColor: '#FFFFFF',
        borderColor: '#ADAFBB',
        borderWidth: 1,
        borderRadius: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 5,
        marginLeft: 5,
    },
    image: {
        width: 80,
        height: 80,
        resizeMode: 'contain',
    },
});

interface HeaderButtonProps {
    onPress: () => void;
    children: ReactNode;
}

export const HeaderButton = ({ onPress, children }: HeaderButtonProps) => (
    <PeepsButton onPress={onPress} style={styles.button}>
        {children}
    </PeepsButton>
);
