import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';

import { useTheme, Theme } from '../theme';
import { Replay } from '../icons';

export type ReplayButtonOverlayProps = {
    onReplay: () => void;
};

export function ReplayButtonOverlay({ onReplay }: ReplayButtonOverlayProps) {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <View style={styles.container} pointerEvents="box-none">
            <View style={styles.backdrop} pointerEvents="none" />

            <Pressable onPress={onReplay} style={styles.button}>
                <Replay size={30} style={styles.icon} />
                <Text style={styles.text}>Replay</Text>
            </Pressable>
        </View>
    );
}

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            ...StyleSheet.absoluteFillObject,
            justifyContent: 'center',
            alignItems: 'center',
        },
        backdrop: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0,0,0,0.6)',
        },
        button: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        icon: {
            marginRight: 8,
        },
        text: {
            color: theme.colors.ActiveText,
            fontSize: 18,
        },
    });
}
