import React, { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    button: {
        // width: 100, // adjust to fit your needs
        // height: 100, // adjust to fit your needs
        // justifyContent: 'center',
        // alignItems: 'center',
        // backgroundColor: '#fff', // change or remove if using the image as background
        // borderRadius: 50, // make the button round

        width: 52,
        height: 52,
        position: 'absolute',
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
    image: {
        width: 80, // adjust to fit your needs
        height: 80, // adjust to fit your needs
        resizeMode: 'contain',
    },
});

export const HeaderButton = ({
    onPress,
    children,
}: {
    onPress: () => void;
    children: ReactNode;
}) => (
    <Pressable
        style={styles.button}
        onPress={onPress}
        onPointerEnter={({ target }) => {
            target.style.backgroundColor = '#f0f0f0';
        }}
        onPointerLeave={({ target }) => {
            target.style.backgroundColor = '#fff';
        }}
    >
        {children}
    </Pressable>
);
