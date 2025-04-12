import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useTheme, Theme } from '../theme';

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
                <Text style={{ color: theme.colors.InactiveText }}>
                    {buttonText}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

function createCreateContentButtonStyles(theme: Theme) {
    return StyleSheet.create({
        bottomSection: {
            height: 60,
            borderTopWidth: 1,
            borderTopColor: '#4A3A5A',
            backgroundColor: theme.colors.SecondaryBackground,
            justifyContent: 'center',
            paddingHorizontal: 10,
        },
        input: {
            backgroundColor: theme.colors.TextInput,
            color: theme.colors.ActiveText,
            paddingVertical: 10,
            paddingHorizontal: 15,
            borderRadius: 20,
            fontSize: 14,
        },
    });
}
