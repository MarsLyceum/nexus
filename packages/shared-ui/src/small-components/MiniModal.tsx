import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Portal } from 'react-native-paper';
import { COLORS } from '../constants';

export type MiniModalProps = {
    visible: boolean;
    onClose: () => void;
    containerStyle?: object;
    // Anchor position holds the layout (x, y, width, height) of the target element.
    anchorPosition?: { x: number; y: number; width: number; height: number };
    children: React.ReactNode;
    /** When true, clicks outside the modal will close it (default: true) */
    closeOnOutsideClick?: boolean;
    centered?: boolean;
    /**
     * If true, the modal’s right edge will be aligned with the anchor’s right edge
     * and its top will match the anchor’s top (the new behavior for the message options modal).
     * If false or not provided, the modal will use the old logic (used for GIF modal).
     */
    useRightAnchorAlignment?: boolean;
    onMouseEnter?: (() => void) | undefined;
    onMouseLeave?: (() => void) | undefined;
};

export const MiniModal: React.FC<MiniModalProps> = ({
    visible,
    onClose,
    containerStyle,
    anchorPosition,
    children,
    closeOnOutsideClick = true,
    useRightAnchorAlignment = false,
    onMouseEnter,
    onMouseLeave,
    centered,
}) => {
    const modalRef = useRef<View>(null);
    const [measuredHeight, setMeasuredHeight] = useState<number | undefined>();
    const [measuredWidth, setMeasuredWidth] = useState<number | undefined>();

    const flattenedContainerStyle = StyleSheet.flatten(containerStyle);

    // Outside click detection
    useEffect(() => {
        if (!visible || !closeOnOutsideClick) return;

        const handleOutsideClick = (e: MouseEvent) => {
            if (modalRef.current) {
                const modalElement = modalRef.current as unknown as Element;
                if (!modalElement.contains(e.target as Node)) {
                    onClose();
                }
            }
        };

        document.addEventListener('mousedown', handleOutsideClick, {
            passive: true,
        });
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [visible, closeOnOutsideClick, onClose]);

    if (!visible) return null;

    let computedContainerStyle;

    if (centered) {
        // Skip anchor logic and simply center the modal.
        // Use your measured dimensions or fallback widths/heights.
        const desiredWidth =
            (flattenedContainerStyle &&
                (flattenedContainerStyle as any).width) ||
            420;
        const desiredHeight =
            (flattenedContainerStyle &&
                (flattenedContainerStyle as any).height) ||
            200;
        const modalWidth =
            measuredWidth !== undefined ? measuredWidth : desiredWidth;
        const modalHeight =
            measuredHeight !== undefined ? measuredHeight : desiredHeight;

        computedContainerStyle = {
            ...flattenedContainerStyle,
            position: 'absolute',
            left: '50%',
            top: '50%',
            // For a perfect center, shift by half the modal's width & height:
            transform: [
                { translateX: -modalWidth / 2 },
                { translateY: -modalHeight / 2 },
            ],
        };
    } else if (anchorPosition) {
        if (useRightAnchorAlignment) {
            // New logic: align the modal’s right edge with the anchor’s right edge,
            // and set its top to the anchor’s top.
            const { width: screenWidth } = Dimensions.get('window');
            // Use the width from containerStyle if available; fallback to 260.
            const desiredWidth =
                (flattenedContainerStyle &&
                    (flattenedContainerStyle as any).width) ||
                260;

            const modalWidth =
                measuredWidth !== undefined ? measuredWidth : desiredWidth;
            // Compute the left coordinate so that left + desiredWidth equals anchorPosition.x
            let computedLeft = anchorPosition.x - modalWidth;
            // Clamp computedLeft so that the modal doesn't go off-screen.
            computedLeft = Math.max(
                0,
                Math.min(computedLeft, screenWidth - modalWidth)
            );
            const computedTop = anchorPosition.y;
            computedContainerStyle = {
                ...flattenedContainerStyle,
                position: 'absolute',
                left: computedLeft,
                top: computedTop,
            };
        } else {
            // Old logic: compute position based on available space (fitsAbove, fitsBelow, etc.)
            const { width: screenWidth, height: screenHeight } =
                Dimensions.get('window');
            const desiredWidth =
                (flattenedContainerStyle &&
                    (flattenedContainerStyle as any).width) ||
                350;
            const desiredHeight =
                (flattenedContainerStyle &&
                    (flattenedContainerStyle as any).maxHeight) ||
                250;

            const modalWidth =
                measuredWidth !== undefined ? measuredWidth : desiredWidth;
            const modalHeight =
                measuredHeight !== undefined ? measuredHeight : desiredHeight;

            const horizontalMargin = screenWidth * 0.02;
            const verticalMargin = screenHeight * 0.02;
            const offset = 5;

            const availableAbove = anchorPosition.y - verticalMargin;
            const availableBelow =
                screenHeight -
                (anchorPosition.y + anchorPosition.height) -
                verticalMargin;
            const availableRight =
                screenWidth -
                (anchorPosition.x + anchorPosition.width) -
                horizontalMargin;
            const availableLeft = anchorPosition.x - horizontalMargin;

            const fitsAbove = availableAbove >= modalHeight;
            const fitsBelow = availableBelow >= modalHeight;
            const fitsRight = availableRight >= modalWidth;
            const fitsLeft = availableLeft >= modalWidth;

            let computedLeft;
            let computedTop;

            if (!fitsAbove && !fitsBelow && !fitsRight && !fitsLeft) {
                const ratioAbove = availableAbove / modalHeight;
                const ratioBelow = availableBelow / modalHeight;
                const ratioRight = availableRight / modalWidth;
                const ratioLeft = availableLeft / modalWidth;
                const ratios = [
                    { direction: 'above', ratio: ratioAbove },
                    { direction: 'below', ratio: ratioBelow },
                    { direction: 'right', ratio: ratioRight },
                    { direction: 'left', ratio: ratioLeft },
                ];
                const best = ratios.reduce((prev, curr) =>
                    curr.ratio > prev.ratio ? curr : prev
                );

                if (best.direction === 'above') {
                    computedTop = verticalMargin;
                    computedLeft = Math.min(
                        Math.max(
                            anchorPosition.x +
                                anchorPosition.width / 2 -
                                modalWidth / 2,
                            horizontalMargin
                        ),
                        screenWidth - modalWidth - horizontalMargin
                    );
                } else if (best.direction === 'below') {
                    computedTop = screenHeight - modalHeight - verticalMargin;
                    computedLeft = Math.min(
                        Math.max(
                            anchorPosition.x +
                                anchorPosition.width / 2 -
                                modalWidth / 2,
                            horizontalMargin
                        ),
                        screenWidth - modalWidth - horizontalMargin
                    );
                } else if (best.direction === 'right') {
                    computedLeft = screenWidth - modalWidth - horizontalMargin;
                    computedTop = Math.min(
                        Math.max(
                            anchorPosition.y +
                                anchorPosition.height / 2 -
                                modalHeight / 2,
                            verticalMargin
                        ),
                        screenHeight - modalHeight - verticalMargin
                    );
                } else if (best.direction === 'left') {
                    computedLeft = horizontalMargin;
                    computedTop = Math.min(
                        Math.max(
                            anchorPosition.y +
                                anchorPosition.height / 2 -
                                modalHeight / 2,
                            verticalMargin
                        ),
                        screenHeight - modalHeight - verticalMargin
                    );
                }
            } else {
                computedLeft =
                    anchorPosition.x +
                    anchorPosition.width / 2 -
                    modalWidth / 2;
                computedTop = anchorPosition.y - modalHeight - offset;
                if (computedTop < verticalMargin) {
                    computedTop =
                        anchorPosition.y + anchorPosition.height + offset;
                    if (
                        computedTop + modalHeight >
                        screenHeight - verticalMargin
                    ) {
                        computedLeft =
                            anchorPosition.x + anchorPosition.width + offset;
                        if (
                            computedLeft + modalWidth >
                            screenWidth - horizontalMargin
                        ) {
                            computedLeft =
                                anchorPosition.x - modalWidth - offset;
                            if (computedLeft < horizontalMargin) {
                                computedLeft = Math.min(
                                    Math.max(
                                        anchorPosition.x +
                                            anchorPosition.width / 2 -
                                            modalWidth / 2,
                                        horizontalMargin
                                    ),
                                    screenWidth - modalWidth - horizontalMargin
                                );
                            }
                        }
                        computedTop =
                            anchorPosition.y +
                            anchorPosition.height / 2 -
                            modalHeight / 2;
                        computedTop = Math.min(
                            Math.max(computedTop, verticalMargin),
                            screenHeight - modalHeight - verticalMargin
                        );
                    } else {
                        computedLeft = Math.min(
                            Math.max(
                                anchorPosition.x +
                                    anchorPosition.width / 2 -
                                    modalWidth / 2,
                                horizontalMargin
                            ),
                            screenWidth - modalWidth - horizontalMargin
                        );
                    }
                } else {
                    computedLeft = Math.min(
                        Math.max(computedLeft, horizontalMargin),
                        screenWidth - modalWidth - horizontalMargin
                    );
                }
            }

            const availableBottom = screenHeight - verticalMargin;
            // Clamp computedTop to ensure the modal stays fully visible vertically.
            computedTop = Math.max(
                Math.min(computedTop ?? 0, availableBottom - modalHeight),
                verticalMargin
            );

            computedContainerStyle = {
                ...flattenedContainerStyle,
                position: 'absolute',
                left: computedLeft,
                top: computedTop,
            };
        }
    } else {
        computedContainerStyle = StyleSheet.flatten([
            styles.miniModalContainer,
            flattenedContainerStyle,
        ]);
    }

    return (
        <Portal>
            <View
                ref={modalRef}
                style={[computedContainerStyle, { pointerEvents: 'auto' }]}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                onLayout={(e) => {
                    setMeasuredHeight(e.nativeEvent.layout.height);
                    setMeasuredWidth(e.nativeEvent.layout.width);
                }}
            >
                {children}
            </View>
        </Portal>
    );
};

const styles = StyleSheet.create({
    miniModalContainer: {
        position: 'absolute',
        left: '50%',
        bottom: 70,
        width: 350,
        maxHeight: 250,
        backgroundColor: COLORS.PrimaryBackground,
        borderRadius: 8,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
        transform: [{ translateX: -175 }],
    },
});
