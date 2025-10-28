import React, { useMemo } from 'react';
import { PressableProps, Pressable, ViewStyle, Text } from 'react-native';

import { useTheme } from '../theme';
import { createSharedStyles } from '../styles';

interface SecondaryButtonProps extends PressableProps {
    title: string;
    style?: ViewStyle;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
    onPress,
    title,
    style,
}) => {
    const { theme } = useTheme();
    const sharedStyles = useMemo(() => createSharedStyles(theme), [theme]);

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                pressed
                    ? sharedStyles.secondaryButtonPressed
                    : sharedStyles.secondaryButton,
                { minWidth: 280, minHeight: 50 },
                style,
            ]}
        >
            <Text style={sharedStyles.secondaryButtonText}>{title}</Text>
        </Pressable>
    );
};
