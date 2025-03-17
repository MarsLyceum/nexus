import React, { useState, useRef } from 'react';
import {
    Text,
    View,
    Pressable,
    Platform,
    StyleSheet,
    View as RNView,
    LayoutChangeEvent,
    Dimensions,
} from 'react-native';
import { Portal } from 'react-native-paper';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../constants';

// Choose trigger component based on platform
const TriggerView = Platform.OS === 'web' ? View : Pressable;

export const Tooltip = ({
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
    const triangleHeight = 6; // Height of the arrow indicator
    const verticalOffset = 4; // Extra vertical offset

    // Define margins to keep tooltip away from screen edges
    const horizontalMargin = 8;
    const verticalMargin = 8;

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

    // Get screen dimensions
    const { width: screenWidth, height: screenHeight } =
        Dimensions.get('window');

    let computedLeft = 0;
    let computedTop = 0;
    let isTooltipAbove = true;
    let triggerCenter = 0;
    let arrowLeft = 0;
    if (triggerPos) {
        // Compute the trigger's center x position.
        triggerCenter = triggerPos.x + triggerPos.width / 2;
        // Initially center the tooltip bubble on the trigger.
        computedLeft = triggerCenter - bubbleWidth / 2;
        // Clamp horizontally so the bubble stays within margins.
        if (computedLeft < horizontalMargin) {
            computedLeft = horizontalMargin;
        } else if (
            computedLeft + bubbleWidth >
            screenWidth - horizontalMargin
        ) {
            computedLeft = screenWidth - bubbleWidth - horizontalMargin;
        }
        // Compute top for tooltip above trigger.
        computedTop =
            triggerPos.y - bubbleHeight - triangleHeight - verticalOffset;
        // If tooltip goes too close to the top, reposition it below the trigger.
        if (computedTop < verticalMargin) {
            computedTop =
                triggerPos.y +
                triggerPos.height +
                triangleHeight +
                verticalOffset;
            isTooltipAbove = false;
            if (computedTop + bubbleHeight > screenHeight - verticalMargin) {
                computedTop = screenHeight - bubbleHeight - verticalMargin;
            }
        }
        // Compute arrow's horizontal offset inside the bubble.
        // Arrow width is assumed to be 12.
        arrowLeft = triggerCenter - computedLeft - 6;
        // Clamp arrow so it stays inside the bubble.
        if (arrowLeft < 0) arrowLeft = 0;
        if (arrowLeft > bubbleWidth - 12) arrowLeft = bubbleWidth - 12;
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
                        <View style={styles.bubbleContainer}>
                            {/* Render arrow above bubble if tooltip is below trigger */}
                            {!isTooltipAbove && (
                                <View
                                    style={[
                                        styles.arrow,
                                        {
                                            left: arrowLeft,
                                            top: -triangleHeight,
                                            transform: [{ rotate: '180deg' }],
                                        },
                                    ]}
                                >
                                    <RoundedTriangle
                                        color={COLORS.AppBackground}
                                    />
                                </View>
                            )}
                            <View
                                style={styles.tooltipBubble}
                                onLayout={onBubbleLayout}
                            >
                                <Text
                                    style={styles.tooltipText}
                                    numberOfLines={1}
                                >
                                    {tooltipText}
                                </Text>
                            </View>
                            {/* Render arrow below bubble if tooltip is above trigger */}
                            {isTooltipAbove && (
                                <View
                                    style={[
                                        styles.arrow,
                                        {
                                            left: arrowLeft,
                                            top: bubbleHeight - 1,
                                        },
                                    ]}
                                >
                                    <RoundedTriangle
                                        color={COLORS.AppBackground}
                                    />
                                </View>
                            )}
                        </View>
                    </View>
                </Portal>
            )}
        </View>
    );
};

export const RoundedTriangle = ({
    color,
    style,
}: {
    color: string;
    style?: object;
}) => (
    <Svg width="12" height="6" viewBox="0 0 12 6" style={style}>
        <Path d="M2,0 Q6,0 10,0 L6,6 Q6,6 2,0 Z" fill={color} />
    </Svg>
);

const styles = StyleSheet.create({
    tooltipContainer: {
        position: 'relative',
    },
    portalContainer: {
        position: 'absolute',
    },
    bubbleContainer: {
        position: 'relative',
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
    arrow: {
        position: 'absolute',
        width: 12,
        height: 6,
    },
});
