import { Platform } from 'react-native';

import { toRgba } from './colors';

export const createLayeredShadow = (
    color: string,
    baseOpacity: number,
    layers = 25
) => {
    const maxBlur = 96;
    const shadows = [];

    for (let i = 0; i < layers; i++) {
        const progress = i / (layers - 1);
        const normalizedProgress = progress * 2 - 1;
        const gaussianFalloff = Math.exp(
            -normalizedProgress * normalizedProgress * 2
        );
        const blur = Math.round(progress * maxBlur);
        const layerOpacity = baseOpacity * gaussianFalloff * 0.12;

        shadows.push(`0 0 ${blur}px ${toRgba(color, layerOpacity)}`);
    }

    return shadows.join(', ');
};

export const createGlowKeyframes = (color: string) => {
    const shadowMin = createLayeredShadow(color, 0.28);
    const shadowMax = createLayeredShadow(color, 0.9);

    return `
        @keyframes breathingGlowPrimary {
            0%, 100% {
                box-shadow: ${shadowMin};
            }
            50% {
                box-shadow: ${shadowMax};
            }
        }

        @keyframes breathingGlowSecondary {
            0%, 100% {
                opacity: 0.85;
            }
            50% {
                opacity: 1;
            }
        }

        @keyframes breathingGlowTertiary {
            0%, 100% {
                filter: brightness(1);
            }
            50% {
                filter: brightness(1.04);
            }
        }
    `;
};

export const createWebGlowAnimationStyle = () =>
    Platform.OS === 'web'
        ? {
              animationName:
                  'breathingGlowPrimary, breathingGlowSecondary, breathingGlowTertiary',
              animationDuration: '4.2s, 6.0s, 7.6s',
              animationTimingFunction:
                  'cubic-bezier(0.45, 0.05, 0.55, 0.95), cubic-bezier(0.4, 0, 0.6, 1), cubic-bezier(0.42, 0, 0.58, 1)',
              animationIterationCount: 'infinite, infinite, infinite',
          }
        : {};
