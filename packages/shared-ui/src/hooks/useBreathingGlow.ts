import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

export const useBreathingGlow = (
    initialIntensity = 0.28,
    minIntensity = 0.15,
    maxIntensity = 0.45,
    duration = 2000
) => {
    const primaryGlow = useRef(new Animated.Value(initialIntensity)).current;
    const secondaryGlow = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const primary = Animated.loop(
            Animated.sequence([
                Animated.timing(primaryGlow, {
                    toValue: maxIntensity,
                    duration: duration * 1.85,
                    easing: Easing.bezier(0.45, 0.05, 0.55, 0.95),
                    useNativeDriver: false,
                }),
                Animated.timing(primaryGlow, {
                    toValue: minIntensity,
                    duration: duration * 1.85,
                    easing: Easing.bezier(0.45, 0.05, 0.55, 0.95),
                    useNativeDriver: false,
                }),
            ])
        );

        const secondary = Animated.loop(
            Animated.sequence([
                Animated.timing(secondaryGlow, {
                    toValue: maxIntensity * 0.3,
                    duration: duration * 2.65,
                    easing: Easing.bezier(0.4, 0, 0.6, 1),
                    useNativeDriver: false,
                }),
                Animated.timing(secondaryGlow, {
                    toValue: -maxIntensity * 0.15,
                    duration: duration * 2.65,
                    easing: Easing.bezier(0.4, 0, 0.6, 1),
                    useNativeDriver: false,
                }),
            ])
        );

        primary.start();
        secondary.start();

        return () => {
            primary.stop();
            secondary.stop();
        };
    }, [primaryGlow, secondaryGlow, minIntensity, maxIntensity, duration]);

    return Animated.add(primaryGlow, secondaryGlow);
};
