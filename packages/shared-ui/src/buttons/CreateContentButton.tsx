import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

import { useTheme, Theme } from '../theme';
import {
    BorderRadius,
    Spacing,
    Opacity,
    Typography,
} from '../constants/designSystem';
import { toRgba } from '../utils';

type CreateContentButtonProps = {
    buttonText: string;
    onPress: () => void;
};

export const CreateContentButton: React.FC<CreateContentButtonProps> = ({
    buttonText,
    onPress,
}) => {
    const { theme } = useTheme();
    const styles = useMemo(
        () => createCreateContentButtonStyles(theme),
        [theme]
    );

    return (
        <View style={styles.bottomSection}>
            <TouchableOpacity style={styles.input} onPress={onPress}>
                <Text style={styles.inputText}>{buttonText}</Text>
            </TouchableOpacity>
        </View>
    );
};

function createCreateContentButtonStyles(theme: Theme) {
    return StyleSheet.create({
        bottomSection: {
            height: 60,
            borderTopWidth: 1,
            borderTopColor: toRgba(
                theme.colors.ActiveText,
                Opacity.BorderMedium
            ),
            backgroundColor: theme.colors.SecondaryBackground,
            justifyContent: 'center',
            paddingHorizontal: Spacing.SM,
        },
        input: {
            backgroundColor: theme.colors.TextInput,
            paddingVertical: Spacing.SM,
            paddingHorizontal: Spacing.LG,
            borderRadius: BorderRadius.XL,
        },
        inputText: {
            ...Typography.Code,
            fontFamily: theme.fonts.primary?.regular,
            color: theme.colors.InactiveText,
        },
    });
}
