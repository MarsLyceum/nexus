import React, { useState, useRef } from 'react';
import {
    Text,
    View,
    Pressable,
    Platform,
    StyleSheet,
    View as RNView,
    LayoutChangeEvent,
} from 'react-native';
import { Portal } from 'react-native-paper';
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
    // Control tooltip visibility and trigger position
    const [open, setOpen] = useState(false);
    const [triggerPos, setTriggerPos] = useState<{
        x: number;
        y: number;
        width: number;
        height: number;
    } | null>(null);

    // State for tooltip bubble dimensions
    const [bubbleWidth, setBubbleWidth] = useState(0);
    const [bubbleHeight, setBubbleHeight] = useState(0);
    const triangleHeight = 6; // Height of the triangle indicator

    const triggerWrapperRef = useRef<RNView>(null);

    // Measure trigger element on show
    const showTooltip = () => {
        if (triggerWrapperRef.current) {
            triggerWrapperRef.current.measureInWindow((x, y, width, height) => {
                setTriggerPos({ x, y, width, height });
            });
        }
        setOpen(true);
    };

    const hideTooltip = () => {
        setOpen(false);
    };

    // Setup event handlers
    const triggerProps =
        Platform.OS === 'web'
            ? { onMouseEnter: showTooltip, onMouseLeave: hideTooltip }
            : { onPress: showTooltip };

    // Capture tooltip bubble dimensions
    const onBubbleLayout = (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        setBubbleWidth(width);
        setBubbleHeight(height);
    };

    // Compute tooltip position (if measured)
    let computedLeft = 0;
    let computedTop = 0;
    if (triggerPos) {
        computedLeft = triggerPos.x + triggerPos.width / 2 - bubbleWidth / 2;
        computedTop = triggerPos.y - bubbleHeight - triangleHeight;
    }

    return (
        <View style={styles.tooltipContainer}>
            {/* Wrap trigger element in a View to capture its measurements */}
            <View ref={triggerWrapperRef}>
                <TriggerView {...triggerProps}>
                    {children ?? <Text>{tooltipText}</Text>}
                </TriggerView>
            </View>
            {open && triggerPos && (
                <Portal>
                    <View
                        style={[
                            styles.portalContainer,
                            { top: computedTop, left: computedLeft },
                        ]}
                    >
                        {/* Tooltip bubble */}
                        <View
                            style={styles.tooltipBubble}
                            onLayout={onBubbleLayout}
                        >
                            <Text style={styles.tooltipText} numberOfLines={1}>
                                {tooltipText}
                            </Text>
                        </View>
                        {/* Triangle indicator */}
                        <View style={styles.triangle} />
                    </View>
                </Portal>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    tooltipContainer: {
        position: 'relative',
    },
    portalContainer: {
        position: 'absolute',
    },
    tooltipBubble: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: COLORS.AppBackground,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 2,
        zIndex: 999,
    },
    tooltipText: {
        color: COLORS.White,
        fontSize: 14,
    },
    triangle: {
        width: 0,
        height: 0,
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderTopWidth: 6,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: COLORS.AppBackground,
        alignSelf: 'center',
    },
});
