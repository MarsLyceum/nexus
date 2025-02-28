import React, { useState } from 'react';
import { Text, View, Pressable, Platform, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

// Choose trigger component based on platform
const TriggerView = Platform.OS === 'web' ? View : Pressable;

export const NexusTooltip = ({
    tooltipText,
    children,
}: {
    tooltipText: string;
    children?: React.ReactNode;
}) => {
    const [open, setOpen] = useState(false);

    // Web event handlers
    const handleMouseEnter = () => {
        setOpen(true);
    };
    const handleMouseLeave = () => {
        setOpen(false);
    };

    // Mobile event handler
    const handlePress = () => {
        setOpen(true);
        // Auto-dismiss tooltip after 500ms on mobile
        setTimeout(() => {
            setOpen(false);
        }, 500);
    };

    // Setup trigger props based on platform
    const triggerProps =
        Platform.OS === 'web'
            ? { onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave }
            : { onPress: handlePress };

    return (
        <View style={styles.tooltipContainer}>
            <TriggerView {...triggerProps}>
                {children ?? (
                    // Fallback: use a default trigger that shows the tooltipText
                    <Text>{tooltipText}</Text>
                )}
            </TriggerView>
            {open && (
                <View style={styles.tooltip}>
                    <Text style={styles.tooltipText} numberOfLines={1}>
                        {tooltipText}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    tooltipContainer: {
        position: 'relative',
    },
    tooltip: {
        position: 'absolute',
        bottom: '100%', // Position above the trigger element
        left: 0,
        marginBottom: 4, // Small gap between the trigger and tooltip
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: COLORS.AppBackground,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 2,
    },
    tooltipText: {
        color: COLORS.White,
        fontSize: 14,
    },
});
