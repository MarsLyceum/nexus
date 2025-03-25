import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { COLORS } from '../constants';

type CreateContentButtonProps = {
    buttonText: string;
    onPress: () => void;
};

export const CreateContentButton: React.FC<CreateContentButtonProps> = ({
    buttonText,
    onPress,
}) => (
    <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.input} onPress={onPress}>
            <Text style={{ color: COLORS.InactiveText }}>{buttonText}</Text>
        </TouchableOpacity>
    </View>
);

const styles = StyleSheet.create({
    bottomSection: {
        height: 60,
        borderTopWidth: 1,
        borderTopColor: '#4A3A5A',
        backgroundColor: COLORS.SecondaryBackground,
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    input: {
        backgroundColor: COLORS.TextInput,
        color: 'white',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        fontSize: 14,
    },
});
