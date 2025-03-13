import React, { useState } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { NexusTooltip } from './NexusTooltip';
import { COLORS } from '../constants';

export type ActionButtonProps = {
    onPress: () => void;
    tooltipText?: string;
    style?: ViewStyle;
    children: React.ReactNode;
};

export const ActionButton: React.FC<ActionButtonProps> = ({
    onPress,
    tooltipText,
    style,
    children,
}) => {
    const [active, setActive] = useState(false);

    const content = (
        <Pressable
            onPress={onPress}
            onHoverIn={() => setActive(true)}
            onHoverOut={() => setActive(false)}
            onPressIn={() => setActive(true)}
            onPressOut={() => setActive(false)}
            style={[styles.iconButton, style]}
        >
            {active && (
                <View style={styles.activeOverlay} pointerEvents="none" />
            )}
            <View style={styles.childrenContainer}>{children}</View>
        </Pressable>
    );

    return tooltipText ? (
        <NexusTooltip tooltipText={tooltipText}>{content}</NexusTooltip>
    ) : (
        content
    );
};

const styles = StyleSheet.create({
    iconButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.AppBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        position: 'relative',
        overflow: 'hidden',
    },
    activeOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.04)', // extremely subtle white overlay
        borderRadius: 16,
    },
    childrenContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
