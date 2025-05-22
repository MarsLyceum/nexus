// Tooltip.tsx
import React, { useState, useRef, useMemo } from 'react';
import {
    Text,
    View,
    Pressable,
    StyleSheet,
    View as RNView,
    LayoutChangeEvent,
    Dimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Portal } from '../providers';
import { useTheme, Theme } from '../theme';
import { useIsComputer } from '../hooks';

export const Tooltip = ({
    text,
    children,
}: {
    text: string;
    children?: React.ReactNode;
}) => {
    // Otherwise, on computer devices, use the tooltip functionality.
    const [open, setOpen] = useState(false);
    const [triggerPos, setTriggerPos] = useState<
        | {
              x: number;
              y: number;
              width: number;
              height: number;
          }
        | undefined
    >();
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const isComputer = useIsComputer();

    // Dimensions for the tooltip bubble.
    const [bubbleWidth, setBubbleWidth] = useState(0);
    const [bubbleHeight, setBubbleHeight] = useState(0);
    const triangleHeight = 6; // Height of the arrow indicator.
    const verticalOffset = 4; // Extra vertical offset.
    const horizontalMargin = 8;
    const verticalMargin = 8;

    const triggerWrapperRef = useRef<RNView>(null);

    // Show tooltip: measure trigger position and set tooltip open.
    const showTooltip = () => {
        if (triggerWrapperRef.current) {
            triggerWrapperRef.current.measureInWindow((x, y, width, height) => {
                setTriggerPos({ x, y, width, height });
            });
        }
        setOpen(true);
    };

    // Hide tooltip.
    const hideTooltip = () => {
        setOpen(false);
    };

    // Use onMouseEnter and onMouseLeave for computers.
    const triggerProps = {
        onMouseEnter: showTooltip,
        onMouseLeave: hideTooltip,
    };

    // Capture tooltip bubble dimensions.
    const onBubbleLayout = (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        setBubbleWidth(width);
        setBubbleHeight(height);
    };

    // Get screen dimensions.
    const { width: screenWidth, height: screenHeight } =
        Dimensions.get('window');

    let computedLeft = 0;
    let computedTop = 0;
    let isTooltipAbove = true;
    let triggerCenter = 0;
    let arrowLeft = 0;

    if (triggerPos) {
        // Compute the center of the trigger.
        triggerCenter = triggerPos.x + triggerPos.width / 2;
        // Center the tooltip bubble on the trigger.
        computedLeft = triggerCenter - bubbleWidth / 2;
        if (computedLeft < horizontalMargin) {
            computedLeft = horizontalMargin;
        } else if (
            computedLeft + bubbleWidth >
            screenWidth - horizontalMargin
        ) {
            computedLeft = screenWidth - bubbleWidth - horizontalMargin;
        }
        // Position the tooltip above the trigger.
        computedTop =
            triggerPos.y - bubbleHeight - triangleHeight - verticalOffset;
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
        // Calculate the arrow's horizontal offset within the bubble.
        arrowLeft = triggerCenter - computedLeft - 6;
        if (arrowLeft < 0) arrowLeft = 0;
        if (arrowLeft > bubbleWidth - 12) arrowLeft = bubbleWidth - 12;
    }

    // Tooltip content: bubble with arrow. Set pointerEvents="none" so it doesn't intercept touches.
    const tooltipContent = (
        <View style={styles.bubbleContainer} pointerEvents="none">
            {/* Render arrow above bubble if tooltip is below the trigger */}
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
                    pointerEvents="none"
                >
                    <RoundedTriangle color={theme.colors.AppBackground} />
                </View>
            )}
            <View
                style={styles.tooltipBubble}
                onLayout={onBubbleLayout}
                pointerEvents="none"
            >
                <Text style={styles.tooltipText} numberOfLines={1}>
                    {text}
                </Text>
            </View>
            {/* Render arrow below bubble if tooltip is above the trigger */}
            {isTooltipAbove && (
                <View
                    style={[
                        styles.arrow,
                        {
                            left: arrowLeft,
                            top: bubbleHeight - 1,
                        },
                    ]}
                    pointerEvents="none"
                >
                    <RoundedTriangle color={theme.colors.AppBackground} />
                </View>
            )}
        </View>
    );

    // If not on a computer, return the children without tooltip functionality.
    if (!isComputer) {
        return <>{children}</>;
    }

    return (
        <View style={styles.tooltipContainer}>
            {/* Wrap trigger element to capture measurements */}
            <View ref={triggerWrapperRef}>
                <Pressable {...triggerProps}>
                    {children ?? <Text>{text}</Text>}
                </Pressable>
            </View>
            {open && triggerPos && (
                <Portal>
                    <View style={styles.fullScreenWrapper} pointerEvents="none">
                        <View
                            style={[
                                styles.portalContainer,
                                { top: computedTop, left: computedLeft },
                            ]}
                            pointerEvents="none"
                        >
                            {tooltipContent}
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

function createStyles(theme: Theme) {
    return StyleSheet.create({
        tooltipContainer: {
            position: 'relative',
        },
        fullScreenWrapper: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
        },
        portalContainer: {
            position: 'absolute',
            zIndex: 999,
        },
        bubbleContainer: {
            position: 'relative',
        },
        tooltipBubble: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
            backgroundColor: theme.colors.AppBackground,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.3,
            shadowRadius: 2,
            elevation: 2,
        },
        tooltipText: {
            color: theme.colors.ActiveText,
            fontSize: 14,
        },
        arrow: {
            position: 'absolute',
            width: 12,
            height: 6,
        },
    });
}
