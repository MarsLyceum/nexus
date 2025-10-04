import React from 'react';
import { Platform, StyleSheet } from 'react-native';

import type { Theme } from '../theme';
import { toRgba } from '../utils';
import { BorderRadius, Spacing, Opacity } from '../constants/designSystem';

type GlowConfig = {
    radius?: number;
    intensity?: number;
    offsetY?: number;
};

const createGlowKeyframes = (color: string) => `
    @keyframes glow-pulse {
        0%, 100% {
            filter: drop-shadow(0 0 8px ${color}55)
                    drop-shadow(0 0 16px ${color}33);
        }
        50% {
            filter: drop-shadow(0 0 12px ${color}77)
                    drop-shadow(0 0 24px ${color}44);
        }
    }
`;

export const applyGlow = (
    theme: Theme,
    { radius = 24, intensity = 0.28, offsetY = 12 }: GlowConfig = {}
) => ({
    shadowColor: theme.colors.Primary,
    shadowOpacity: intensity,
    shadowRadius: radius,
    shadowOffset: { width: 0, height: offsetY },
    elevation: Platform.select({ android: radius, default: 0 }),
    backgroundColor: theme.colors.TertiaryBackground,
    borderWidth: 1,
    borderColor: toRgba(theme.colors.ActiveText, Opacity.Border),
});

export const createMultiLayerContainer = (theme: Theme) =>
    StyleSheet.create({
        backdrop: {
            flex: 1,
            backgroundColor: theme.colors.AppBackground,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: Spacing.XXL,
            paddingVertical: Spacing.XXXL,
        },
        shellContainer: {
            width: '100%',
            maxWidth: 640,
            borderRadius: BorderRadius.ExtraLarge,
        },
        shell: {
            width: '100%',
            borderRadius: BorderRadius.ExtraLarge,
            padding: Spacing.XS,
            backgroundColor: theme.colors.TertiaryBackground,
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, Opacity.Border),
        },
        card: {
            width: '100%',
            borderRadius: BorderRadius.Large,
            padding: Spacing.XXXL,
            backgroundColor: theme.colors.SecondaryBackground,
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, Opacity.Border),
        },
    });

export const createScrollbarStyles = (
    theme: Theme,
    primaryColor: string,
    scrollId: string
) => {
    if (Platform.OS !== 'web') {
        return null;
    }

    return (
        <style>{`
            ${createGlowKeyframes(primaryColor)}

            #${scrollId} {
                scrollbar-width: thin;
                scrollbar-color: ${theme.colors.Primary} ${theme.colors.SecondaryBackground};
            }

            #${scrollId}::-webkit-scrollbar {
                width: 10px;
            }

            #${scrollId}::-webkit-scrollbar-track {
                background: linear-gradient(180deg, ${theme.colors.AppBackground} 0%, ${theme.colors.SecondaryBackground} 100%);
                border-radius: ${BorderRadius.Pill}px;
                border: 1px solid ${toRgba(theme.colors.ActiveText, Opacity.Border)};
            }

            #${scrollId}::-webkit-scrollbar-thumb {
                background: linear-gradient(180deg, ${theme.colors.Primary} 0%, ${theme.colors.Secondary} 100%);
                border-radius: ${BorderRadius.Pill}px;
                border: 2px solid rgba(0, 0, 0, 0.1);
            }

            #${scrollId}::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(180deg, ${theme.colors.Secondary} 0%, ${theme.colors.TertiaryBackground} 100%);
            }

            #${scrollId}::-webkit-scrollbar-thumb:active {
                background: ${theme.colors.Primary};
            }
        `}</style>
    );
};
