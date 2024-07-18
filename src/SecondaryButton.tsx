import React from 'react';
import {
    PressableProps,
    Pressable,
    StyleSheet,
    ViewStyle,
    Platform,
    View,
    Text,
} from 'react-native';

interface SecondaryButtonProps extends PressableProps {
    title: string;
    style?: ViewStyle;
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 25,
        overflow: 'hidden',
        width: 280,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#EBEAEA',
    },
    buttonText: {
        color: '#a3119f',
        fontSize: 16,
        fontWeight: 'bold',
    },
    shadowContainer: {
        borderRadius: 25,
        width: 280,
        height: 50,
        marginLeft: 3, // Adding margin to prevent cutting off
        ...Platform.select({
            web: {
                boxShadow: '0px 2px 5px rgba(0,0,0,0.25)',
            },
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
            },
            android: {
                elevation: 5,
            },
        }),
    },
});

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
    onPress,
    title,
    style,
}) => (
    <View style={[styles.shadowContainer, style]}>
        <Pressable style={styles.container} onPress={onPress}>
            <Text style={styles.buttonText}>{title}</Text>
        </Pressable>
    </View>
);
