import React from 'react';
import { ViewStyle, Pressable, View, StyleSheet, Text } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        margin: 20,
    },
});

export const Footer = ({ style }: { style?: ViewStyle | ViewStyle[] }) => (
    <View style={[styles.container, style]}>
        <Pressable onPress={() => {}}>
            <Text
                style={{
                    color: '#a63fa3',
                    fontSize: 14,
                    fontWeight: 'regular',
                }}
            >
                Terms of Service
            </Text>
        </Pressable>
        <Pressable onPress={() => {}}>
            <Text
                style={{
                    color: '#a63fa3',
                    fontSize: 14,
                    fontWeight: 'regular',
                }}
            >
                Privacy Policy
            </Text>
        </Pressable>
    </View>
);
