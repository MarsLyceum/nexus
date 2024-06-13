import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
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
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = useCallback(() => {
        Animated.spring(scale, {
            toValue: 0.7,
            useNativeDriver: true,
        }).start();
    }, [scale]);

    const handlePressOut = useCallback(() => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    }, [scale]);

    return (
        <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
            <Pressable
                style={styles.container}
                onPointerEnter={() => {
                    setIsHovered(true);
                }}
                onPointerLeave={() => {
                    setIsHovered(false);
                }}
                android_ripple={{ color: '#f0f0f0', borderless: true }}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
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
        </Animated.View>
    );
}
