import React, { useMemo } from 'react';
import {
    Pressable,
    PressableProps,
    StyleSheet,
    ViewStyle,
    Platform,
    View,
    Text,
} from 'react-native';
import { useTheme, Theme } from '../theme';

interface PrimaryGradientButtonProps extends PressableProps {
    title: string;
    style?: ViewStyle | ViewStyle[];
}

function createPrimaryGradientButtonStyles(theme: Theme) {
    return StyleSheet.create({
        shadowContainer: {
            borderRadius: 25,
            width: 280,
            marginLeft: 3, // Adding margin to prevent cutting off
            overflow: Platform.OS === 'web' ? 'visible' : 'hidden',
            ...Platform.select({
                web: {
                    shadowColor: 'rgba(0,0,0,0.25)',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 1,
                    shadowRadius: 5,
                },
                default: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                },
            }),
        },
        button: {
            width: 280,
            height: 50,
            backgroundColor: theme.colors.Primary,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 25,
        },
        textStyles: {
            color: theme.colors.ActiveText,
            fontSize: 16,
            fontWeight: 'bold',
        },
    });
}

export const PrimaryGradientButton: React.FC<PrimaryGradientButtonProps> = ({
    onPress,
    title,
    style,
    ...rest
}) => {
    const { theme } = useTheme();
    const styles = useMemo(
        () => createPrimaryGradientButtonStyles(theme),
        [theme]
    );

    return (
        <View style={[styles.shadowContainer, style]}>
            <Pressable onPress={onPress} style={styles.button} {...rest}>
                <Text>{title}</Text>
            </Pressable>
        </View>
    );
};
