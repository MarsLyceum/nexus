import React, { ReactNode, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

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
    },
    buttonHovered: {
        backgroundColor: '#f0f0f0',
    },
    image: {
        width: 80,
        height: 80,
        resizeMode: 'contain',
    },
});

export const HeaderButton = ({
    onPress,
    children,
}: {
    onPress: () => void;
    children: ReactNode;
}) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Pressable
            style={[styles.button, isHovered && styles.buttonHovered]}
            onPress={onPress}
            onPointerEnter={() => {
                setIsHovered(true);
            }}
            onPointerLeave={() => {
                setIsHovered(false);
            }}
        >
            {children}
        </Pressable>
    );
};
