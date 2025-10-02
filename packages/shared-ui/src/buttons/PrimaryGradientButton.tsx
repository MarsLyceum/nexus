import React, { useMemo } from 'react';
import { Pressable, PressableProps, ViewStyle, Text } from 'react-native';

import { useTheme } from '../theme';
import { createSharedStyles } from '../styles';

interface PrimaryGradientButtonProps extends PressableProps {
    title: string;
    style?: ViewStyle | ViewStyle[];
}

export const PrimaryGradientButton: React.FC<PrimaryGradientButtonProps> = ({
    onPress,
    title,
    style,
    ...rest
}) => {
    const { theme } = useTheme();
    const sharedStyles = useMemo(() => createSharedStyles(theme), [theme]);

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                pressed
                    ? sharedStyles.primaryButtonPressed
                    : sharedStyles.primaryButton,
                { minWidth: 280, minHeight: 50 },
                style,
            ]}
            {...rest}
        >
            <Text style={sharedStyles.primaryButtonText}>{title}</Text>
        </Pressable>
    );
};
