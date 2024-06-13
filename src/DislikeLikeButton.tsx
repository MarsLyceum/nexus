import React, { ReactNode, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    likeDislikeCircle: {
        width: 78,
        height: 78,
        borderRadius: 39,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',

        shadowColor: 'rgba(0, 0, 0, 0.4)',
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 4,
        elevation: 4,
    },
    buttonHovered: {
        backgroundColor: '#f0f0f0',
    },
});

export function DislikeLikeButton({ children }: { children?: ReactNode }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Pressable
            style={[
                styles.likeDislikeCircle,
                isHovered && styles.buttonHovered,
            ]}
            onPointerEnter={() => {
                setIsHovered(true);
            }}
            onPointerLeave={() => {
                setIsHovered(false);
            }}
            android_ripple={{ color: '#f0f0f0', borderless: false }}
        >
            {children}
        </Pressable>
    );
}
