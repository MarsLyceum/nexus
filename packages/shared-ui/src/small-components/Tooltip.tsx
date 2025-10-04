// Tooltip.tsx
import React, {
    useRef,
    useMemo,
    useCallback,
    useEffect,
    useState,
} from 'react';
import {
    Text,
    View,
    Pressable,
    StyleSheet,
    View as RNView,
    LayoutChangeEvent,
    Dimensions,
    Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Portal } from '../providers';
import { useTheme, Theme } from '../theme';
import { useIsComputer } from '../hooks';
import { toRgba, getShadowStyle } from '../utils';
import { resolveHoverBounds, measureNativeView } from '../utils/hoverBounds';
import {
    Spacing,
    BorderRadius,
    Typography,
    Opacity,
} from '../constants/designSystem';
import { useStableHover } from '../hooks/useStableHover';

export const Tooltip = ({
    text,
    children,
}: {
    text: string;
    children?: React.ReactNode;
}) => {
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
    const triangleHeight = Spacing.SM - Spacing.XS;
    const styles = useMemo(
        () => createStyles(theme, triangleHeight),
        [theme, triangleHeight]
    );
    const isComputer = useIsComputer();

    const [bubbleWidth, setBubbleWidth] = useState(0);
    const [bubbleHeight, setBubbleHeight] = useState(0);
    const verticalOffset = Spacing.XS;
    const horizontalMargin = Spacing.SM;
    const verticalMargin = Spacing.SM;

    const triggerWrapperRef = useRef<RNView>(null);
    const fallbackRectRef = useRef<DOMRect | null>(null);

    const measureTrigger = useCallback(() => {
        if (triggerWrapperRef.current) {
            triggerWrapperRef.current.measureInWindow((x, y, width, height) => {
                setTriggerPos({ x, y, width, height });
            });
        }
    }, []);

    const {
        handlers: hoverHandlers,
        isHovering,
        registerBounds,
    } = useStableHover({
        onEnter: measureTrigger,
        onLeave: () => {
            setTriggerPos(undefined);
        },
        suppressNestedTracking: true,
    });

    useEffect(() => {
        if (!isComputer) {
            return undefined;
        }

        measureNativeView(triggerWrapperRef, (rect) => {
            fallbackRectRef.current = rect;
        });

        registerBounds(
            () =>
                resolveHoverBounds({
                    viewRef: triggerWrapperRef,
                    fallbackRectRef,
                }) ??
                fallbackRectRef.current ??
                undefined
        );

        return undefined;
    }, [fallbackRectRef, isComputer, registerBounds]);

    const triggerProps = {
        onMouseEnter: hoverHandlers.onPointerEnter,
        onMouseLeave: (event: MouseEvent<HTMLDivElement>) =>
            hoverHandlers.onPointerLeave({
                clientX: event.clientX,
                clientY: event.clientY,
                rect: event.currentTarget.getBoundingClientRect(),
                containsRelated:
                    event.relatedTarget instanceof Element
                        ? event.currentTarget.contains(event.relatedTarget)
                        : undefined,
            }),
    };

    const onBubbleLayout = (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        setBubbleWidth(width);
        setBubbleHeight(height);
    };

    const { width: screenWidth, height: screenHeight } =
        Dimensions.get('window');

    let computedLeft = 0;
    let computedTop = 0;
    let isTooltipAbove = true;
    let triggerCenter = 0;
    let arrowLeft = 0;

    if (triggerPos) {
        triggerCenter = triggerPos.x + triggerPos.width / 2;
        computedLeft = triggerCenter - bubbleWidth / 2;
        if (computedLeft < horizontalMargin) {
            computedLeft = horizontalMargin;
        } else if (
            computedLeft + bubbleWidth >
            screenWidth - horizontalMargin
        ) {
            computedLeft = screenWidth - bubbleWidth - horizontalMargin;
        }

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

        arrowLeft = triggerCenter - computedLeft - triangleHeight;
        if (arrowLeft < 0) arrowLeft = 0;
        if (arrowLeft > bubbleWidth - triangleHeight * 2) {
            arrowLeft = bubbleWidth - triangleHeight * 2;
        }
    }

    const tooltipContent = (
        <View
            style={{ ...styles.bubbleContainer, pointerEvents: 'none' }}
            pointerEvents={Platform.OS === 'web' ? undefined : 'none'}
        >
            {!isTooltipAbove && (
                <View
                    style={{
                        ...StyleSheet.flatten([
                            styles.arrow,
                            {
                                left: arrowLeft,
                                top: -triangleHeight,
                                transform: [{ rotate: '180deg' }],
                            },
                        ]),
                        pointerEvents: 'none',
                    }}
                    pointerEvents={Platform.OS === 'web' ? undefined : 'none'}
                >
                    <RoundedTriangle color={theme.colors.AppBackground} />
                </View>
            )}
            <View
                style={{ ...styles.tooltipBubble, pointerEvents: 'none' }}
                onLayout={onBubbleLayout}
                pointerEvents={Platform.OS === 'web' ? undefined : 'none'}
            >
                <Text style={styles.tooltipText} numberOfLines={1}>
                    {text}
                </Text>
            </View>
            {isTooltipAbove && (
                <View
                    style={{
                        ...StyleSheet.flatten([
                            styles.arrow,
                            {
                                left: arrowLeft,
                                top: bubbleHeight - 1,
                            },
                        ]),
                        pointerEvents: 'none',
                    }}
                    pointerEvents={Platform.OS === 'web' ? undefined : 'none'}
                >
                    <RoundedTriangle color={theme.colors.AppBackground} />
                </View>
            )}
        </View>
    );

    if (!isComputer) {
        return <>{children}</>;
    }

    return (
        <View style={styles.tooltipContainer}>
            <View ref={triggerWrapperRef}>
                <Pressable {...triggerProps}>
                    {children ?? <Text>{text}</Text>}
                </Pressable>
            </View>
            {isHovering && triggerPos && (
                <Portal>
                    <View
                        style={{
                            ...styles.fullScreenWrapper,
                            pointerEvents: 'none',
                        }}
                        pointerEvents={
                            Platform.OS === 'web' ? undefined : 'none'
                        }
                    >
                        <View
                            style={{
                                ...StyleSheet.flatten([
                                    styles.portalContainer,
                                    { top: computedTop, left: computedLeft },
                                ]),
                                pointerEvents: 'none',
                            }}
                            pointerEvents={
                                Platform.OS === 'web' ? undefined : 'none'
                            }
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

function createStyles(theme: Theme, triangleHeight: number) {
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
            paddingHorizontal: Spacing.SM,
            paddingVertical: Spacing.XS,
            borderRadius: BorderRadius.ExtraSmall,
            backgroundColor: theme.colors.AppBackground,
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, Opacity.BorderSubtle),
            ...getShadowStyle('light'),
        },
        tooltipText: {
            color: theme.colors.ActiveText,
            ...Typography.Caption,
            fontFamily: theme.fonts.secondary?.regular,
            textTransform: 'none',
        },
        arrow: {
            position: 'absolute',
            width: Spacing.SM * 1.5,
            height: triangleHeight,
        },
    });
}
