import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

/**
 * Utility function: darkenColor
 * Darkens a hex color string by a given amount.
 * In production, consider using a library such as polished or tinycolor2.
 */
function darkenColor(hexColor: string, amount: number): string {
    const withoutHash = hexColor.replace('#', '');
    const num = Number.parseInt(withoutHash, 16);

    // eslint-disable-next-line no-bitwise
    let r = (num >> 16) - Math.round(255 * amount);
    // eslint-disable-next-line no-bitwise
    let g = ((num >> 8) & 0xff) - Math.round(255 * amount);
    // eslint-disable-next-line no-bitwise
    let b = (num & 0xff) - Math.round(255 * amount);

    r = Math.max(0, r);
    g = Math.max(0, g);
    b = Math.max(0, b);

    // eslint-disable-next-line no-bitwise
    const darkened = (r << 16) | (g << 8) | b;
    return `#${darkened.toString(16).padStart(6, '0')}`;
}

export type NexusButtonProps = {
    label: string;
    onPress: () => void;
    /**
     * Variant determines the style:
     * - 'filled' shows a solid background (for Save).
     * - 'outline' shows a transparent background with a border (for Cancel).
     */
    variant?: 'filled' | 'outline';
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
}) => {
    const { theme } = useTheme();

    // Determine the button container style based on whether it is pressed.
    const getButtonStyles = (isPressed: boolean) => {
        if (variant === 'filled') {
            const bgColor = isPressed
                ? darkenColor(theme.colors.Primary, 0.1)
                : theme.colors.Primary;
            return {
                backgroundColor: bgColor,
                borderColor: bgColor,
                borderWidth: 2,
                borderRadius: 6,
            };
        }
        // Outline variant uses a transparent background with a colored border.
        const outlineColor = isPressed
            ? darkenColor(theme.colors.Primary, 0.1)
            : theme.colors.Primary;
        return {
            // backgroundColor: 'transparent',
            backgroundColor: theme.colors.ActiveText,
            borderColor: outlineColor,
            borderWidth: 2,
            borderRadius: 6,
        };
    };

    // Determine the text color based on the variant and press state.
    const getTextColor = (isPressed: boolean) => {
        if (variant === 'filled') {
            return theme.colors.ActiveText;
        }
        return isPressed
            ? darkenColor(theme.colors.Primary, 0.1)
            : theme.colors.Primary;
    };

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.nexusButtonBase,
                getButtonStyles(pressed),
            ]}
        >
            {({ pressed }) => (
                <Text
                    style={[
                        styles.buttonTextBase,
                        { color: getTextColor(pressed) },
                    ]}
                >
                    {label}
                </Text>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    nexusButtonBase: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        // Optional shadow on iOS.
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        // Optional elevation on Android.
        elevation: 2,
    },
    buttonTextBase: {
        fontWeight: '700',
        textAlign: 'center',
        fontFamily: 'Roboto_700Bold',
        fontSize: 14,
    },
});
