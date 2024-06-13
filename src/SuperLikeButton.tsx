import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { PeepsBirdSimplified } from './icons';

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        marginLeft: 24,
        marginRight: 24,
    },
    outerCircle: {
        width: 99,
        height: 99,
        borderRadius: 75,
        justifyContent: 'center',
        alignItems: 'center',

        shadowColor: 'rgba(0, 0, 0, 0.3)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 4,
    },
    innerCircle: {
        width: 60,
        height: 60,
        borderRadius: 50,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonHovered: {
        backgroundColor: '#f0f0f0',
    },
});

export function SuperLikeButton() {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Pressable
            style={styles.container}
            onPointerEnter={() => {
                setIsHovered(true);
            }}
            onPointerLeave={() => {
                setIsHovered(false);
            }}
            android_ripple={{ color: '#f0f0f0', borderless: true }}
        >
            <LinearGradient
                colors={['#A3109E', '#FF3A0F']}
                start={{ x: 0.54, y: 0.38 }}
                end={{ x: 0.97, y: 0.97 }}
                style={styles.outerCircle}
            >
                <View
                    style={[
                        styles.innerCircle,
                        isHovered && styles.buttonHovered,
                    ]}
                >
                    <PeepsBirdSimplified />
                </View>
            </LinearGradient>
        </Pressable>
    );
}
