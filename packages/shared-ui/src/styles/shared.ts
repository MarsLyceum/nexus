import { StyleSheet, Platform } from 'react-native';

import type { Theme } from '../theme';
import { toRgba } from '../utils';
import { applyGlow } from './surface';
import {
    BorderRadius,
    Spacing,
    Typography,
    Opacity,
} from '../constants/designSystem';

export const createSharedStyles = (theme: Theme) =>
    StyleSheet.create({
        card: {
            borderRadius: BorderRadius.Large,
            padding: Spacing.XXXL,
            backgroundColor: theme.colors.SecondaryBackground,
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, Opacity.Border),
        },
        cardSmall: {
            borderRadius: BorderRadius.Medium,
            padding: Spacing.XL,
            backgroundColor: theme.colors.SecondaryBackground,
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, Opacity.Border),
        },
        surface: {
            borderRadius: BorderRadius.Medium,
            paddingHorizontal: Spacing.XL,
            paddingVertical: Spacing.LG,
            backgroundColor: theme.colors.TertiaryBackground,
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, Opacity.BorderLight),
        },
        surfaceDark: {
            borderRadius: BorderRadius.Medium,
            paddingHorizontal: Spacing.XL,
            paddingVertical: Spacing.LG,
            backgroundColor: theme.colors.AppBackground,
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, Opacity.BorderMedium),
        },
        badge: {
            alignSelf: 'flex-start',
            borderRadius: BorderRadius.Pill,
            paddingHorizontal: Spacing.LG,
            paddingVertical: 6,
            backgroundColor: theme.colors.Primary,
        },
        badgeText: {
            ...Typography.Eyebrow,
            color: theme.colors.ActiveText,
        },
        sectionLabel: {
            ...Typography.SectionHeading,
            color: theme.colors.MainText,
            marginBottom: Spacing.MD,
        },
        primaryButton: {
            paddingHorizontal: Spacing.XL,
            paddingVertical: Spacing.MD,
            backgroundColor: theme.colors.Primary,
            borderRadius: BorderRadius.Pill,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, Opacity.BorderMedium),
        },
        primaryButtonPressed: {
            paddingHorizontal: Spacing.XL,
            paddingVertical: Spacing.MD,
            backgroundColor: theme.colors.Secondary,
            borderRadius: BorderRadius.Pill,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, Opacity.BorderMedium),
        },
        primaryButtonText: {
            ...Typography.Button,
            color: theme.colors.ActiveText,
        },
        secondaryButton: {
            paddingHorizontal: Spacing.XL,
            paddingVertical: Spacing.MD,
            backgroundColor: theme.colors.SecondaryBackground,
            borderRadius: BorderRadius.Pill,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, Opacity.BorderMedium),
        },
        secondaryButtonPressed: {
            paddingHorizontal: Spacing.XL,
            paddingVertical: Spacing.MD,
            backgroundColor: theme.colors.TertiaryBackground,
            borderRadius: BorderRadius.Pill,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, 0.12),
        },
        secondaryButtonText: {
            ...Typography.Button,
            color: theme.colors.ActiveText,
        },
        outlineButton: {
            paddingHorizontal: Spacing.XL,
            paddingVertical: Spacing.MD,
            backgroundColor: 'transparent',
            borderRadius: BorderRadius.Pill,
            alignItems: 'center',
            borderWidth: 2,
            borderColor: theme.colors.Primary,
        },
        outlineButtonPressed: {
            paddingHorizontal: Spacing.XL,
            paddingVertical: Spacing.MD,
            backgroundColor: toRgba(theme.colors.ActiveText, Opacity.Border),
            borderRadius: BorderRadius.Pill,
            alignItems: 'center',
            borderWidth: 2,
            borderColor: theme.colors.Secondary,
        },
        outlineButtonText: {
            ...Typography.Button,
            color: theme.colors.Primary,
        },
        input: {
            borderRadius: BorderRadius.Medium,
            paddingHorizontal: Spacing.LG,
            paddingVertical: Spacing.MD,
            backgroundColor: theme.colors.TextInput,
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, Opacity.BorderMedium),
            color: theme.colors.ActiveText,
            fontSize: Typography.Body.fontSize,
        },
        inputFocused: {
            borderColor: theme.colors.Primary,
            borderWidth: 2,
        },
        headerTitle: {
            ...Typography.H3,
            color: theme.colors.ActiveText,
        },
        headerSubtitle: {
            ...Typography.BodySmall,
            color: theme.colors.MainText,
            marginTop: Spacing.SM,
        },
        bodyText: {
            ...Typography.Body,
            color: theme.colors.ActiveText,
        },
        subtleText: {
            ...Typography.BodySmall,
            color: theme.colors.MainText,
        },
        codeBlock: {
            fontFamily: Platform.select({
                web: 'monospace',
                default: 'Courier',
            }),
            ...Typography.Code,
            color: theme.colors.ActiveText,
            backgroundColor: theme.colors.AppBackground,
            borderRadius: BorderRadius.ExtraSmall,
            padding: Spacing.MD,
        },
    });

export const createCardWithGlow = (theme: Theme) => ({
    shell: {
        borderRadius: BorderRadius.ExtraLarge,
        padding: Spacing.XS,
        ...applyGlow(theme, { radius: 32, intensity: 0.35, offsetY: 18 }),
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
