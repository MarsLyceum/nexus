import { useMemo } from 'react';
import { Platform } from 'react-native';

import { createWebGlowAnimationStyle } from '../utils';

import { useBreathingGlow } from './useBreathingGlow';

export const useAnimatedGlow = (
    minIntensity = 0.2,
    maxIntensity = 0.5,
    duration = 3000
) => {
    const glowIntensity = useBreathingGlow(
        (minIntensity + maxIntensity) / 2,
        minIntensity,
        maxIntensity,
        duration
    );

    const webAnimation = useMemo(() => createWebGlowAnimationStyle(), []);

    const animatedNativeShadow = useMemo(
        () =>
            glowIntensity.interpolate({
                inputRange: [minIntensity, maxIntensity],
                outputRange: [minIntensity * 1.5, maxIntensity * 1.5],
            }),
        [glowIntensity, minIntensity, maxIntensity]
    );

    const createNativeShadowStyle = (color: string) =>
        Platform.OS !== 'web'
            ? {
                  shadowColor: color,
                  shadowOffset: { width: 0, height: 8 },
                  shadowRadius: 24,
                  shadowOpacity: animatedNativeShadow,
              }
            : {};

    return {
        webAnimation,
        createNativeShadowStyle,
        glowIntensity,
    };
};
