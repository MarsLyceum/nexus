import React, { useMemo } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

import { useTheme, Theme } from '../theme';
import { createSharedStyles } from '../styles';

export type NexusButtonProps = {
    label: string;
    onPress: () => void;
    /**
     * Variant determines the style:
     * - 'filled' shows a solid background (for Save).
     * - 'outline' shows a transparent background with a border (for Cancel).
     */
    variant?: 'filled' | 'outline';
    disabled?: boolean;
};

/**
 * NexusButton Component
 *
 * A themed button component supporting both "filled" and "outline" variants.
 * It uses the theme's primary color and adjusts its appearance based on the variant.
 */
export const NexusButton: React.FC<NexusButtonProps> = ({
    label,
    onPress,
    variant = 'filled',
    disabled = false,
}) => {
    const { theme } = useTheme();
    const sharedStyles = useMemo(() => createSharedStyles(theme), [theme]);
    const styles = useMemo(() => createStyles(theme), [theme]);

    const getButtonStyle = (pressed: boolean) => {
        if (disabled) {
            return [
                variant === 'filled'
                    ? sharedStyles.primaryButton
                    : sharedStyles.outlineButton,
                styles.disabled,
            ];
        }

        if (variant === 'filled') {
            return pressed
                ? sharedStyles.primaryButtonPressed
                : sharedStyles.primaryButton;
        }

        return pressed
            ? sharedStyles.outlineButtonPressed
            : sharedStyles.outlineButton;
    };

    const getTextStyle = () => {
        if (disabled) {
            return [
                variant === 'filled'
                    ? sharedStyles.primaryButtonText
                    : sharedStyles.outlineButtonText,
                styles.disabledText,
            ];
        }

        return variant === 'filled'
            ? sharedStyles.primaryButtonText
            : sharedStyles.outlineButtonText;
    };

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => getButtonStyle(pressed)}
            disabled={disabled}
        >
            <Text style={getTextStyle()}>{label}</Text>
        </Pressable>
    );
};

const createStyles = (theme: Theme) =>
    StyleSheet.create({
        disabled: {
            opacity: 0.5,
        },
        disabledText: {
            color: theme.colors.InactiveText,
        },
    });
