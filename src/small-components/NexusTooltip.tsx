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
import Svg, { Path } from 'react-native-svg';
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

    // Extra offset so the tooltip is a little higher above the trigger
    const verticalOffset = 4;

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
        // Subtract an extra offset to place the tooltip a bit further above the trigger element
        computedTop =
            triggerPos.y - bubbleHeight - triangleHeight - verticalOffset;
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
                        {/* Rounded triangle indicator */}
                        <RoundedTriangle color={COLORS.AppBackground} />
                    </View>
                </Portal>
            )}
        </View>
    );
};

// A rounded triangle component using react-native-svg.
// This triangle is drawn with quadratic curves to round the corners.
// The shape is designed to match the tooltip bubble background.
export const RoundedTriangle = ({ color }: { color: string }) => (
    <Svg width="12" height="6" viewBox="0 0 12 6">
        <Path
            d="
        M2,0 
        Q6,0 10,0 
        L6,6 
        Q6,6 2,0 
        Z
      "
            fill={color}
        />
    </Svg>
);

const styles = StyleSheet.create({
    tooltipContainer: {
        position: 'relative',
    },
    portalContainer: {
        position: 'absolute',
        alignItems: 'center',
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
});
