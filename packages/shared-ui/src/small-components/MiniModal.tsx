import React, { useEffect, useRef } from 'react';
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
};

export const MiniModal: React.FC<MiniModalProps> = ({
    visible,
    onClose,
    containerStyle,
    anchorPosition,
    children,
    closeOnOutsideClick = true,
}) => {
    const modalRef = useRef<View>(null);

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
    if (anchorPosition) {
        const { width: screenWidth, height: screenHeight } =
            Dimensions.get('window');
        const desiredWidth =
            (containerStyle && (containerStyle as any).width) || 350;
        const desiredHeight =
            (containerStyle && (containerStyle as any).maxHeight) || 250;
        const horizontalMargin = screenWidth * 0.02;
        const verticalMargin = screenHeight * 0.02;
        const offset = 20;

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

        const fitsAbove = availableAbove >= desiredHeight;
        const fitsBelow = availableBelow >= desiredHeight;
        const fitsRight = availableRight >= desiredWidth;
        const fitsLeft = availableLeft >= desiredWidth;

        let computedLeft;
        let computedTop;

        if (!fitsAbove && !fitsBelow && !fitsRight && !fitsLeft) {
            const ratioAbove = availableAbove / desiredHeight;
            const ratioBelow = availableBelow / desiredHeight;
            const ratioRight = availableRight / desiredWidth;
            const ratioLeft = availableLeft / desiredWidth;
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
                            desiredWidth / 2,
                        horizontalMargin
                    ),
                    screenWidth - desiredWidth - horizontalMargin
                );
            } else if (best.direction === 'below') {
                computedTop = screenHeight - desiredHeight - verticalMargin;
                computedLeft = Math.min(
                    Math.max(
                        anchorPosition.x +
                            anchorPosition.width / 2 -
                            desiredWidth / 2,
                        horizontalMargin
                    ),
                    screenWidth - desiredWidth - horizontalMargin
                );
            } else if (best.direction === 'right') {
                computedLeft = screenWidth - desiredWidth - horizontalMargin;
                computedTop = Math.min(
                    Math.max(
                        anchorPosition.y +
                            anchorPosition.height / 2 -
                            desiredHeight / 2,
                        verticalMargin
                    ),
                    screenHeight - desiredHeight - verticalMargin
                );
            } else if (best.direction === 'left') {
                computedLeft = horizontalMargin;
                computedTop = Math.min(
                    Math.max(
                        anchorPosition.y +
                            anchorPosition.height / 2 -
                            desiredHeight / 2,
                        verticalMargin
                    ),
                    screenHeight - desiredHeight - verticalMargin
                );
            }
        } else {
            computedLeft =
                anchorPosition.x + anchorPosition.width / 2 - desiredWidth / 2;
            computedTop = anchorPosition.y - desiredHeight - offset;
            if (computedTop < verticalMargin) {
                computedTop = anchorPosition.y + anchorPosition.height + offset;
                if (
                    computedTop + desiredHeight >
                    screenHeight - verticalMargin
                ) {
                    computedLeft =
                        anchorPosition.x + anchorPosition.width + offset;
                    if (
                        computedLeft + desiredWidth >
                        screenWidth - horizontalMargin
                    ) {
                        computedLeft = anchorPosition.x - desiredWidth - offset;
                        if (computedLeft < horizontalMargin) {
                            computedLeft = Math.min(
                                Math.max(
                                    anchorPosition.x +
                                        anchorPosition.width / 2 -
                                        desiredWidth / 2,
                                    horizontalMargin
                                ),
                                screenWidth - desiredWidth - horizontalMargin
                            );
                        }
                    }
                    computedTop =
                        anchorPosition.y +
                        anchorPosition.height / 2 -
                        desiredHeight / 2;
                    computedTop = Math.min(
                        Math.max(computedTop, verticalMargin),
                        screenHeight - desiredHeight - verticalMargin
                    );
                } else {
                    computedLeft = Math.min(
                        Math.max(
                            anchorPosition.x +
                                anchorPosition.width / 2 -
                                desiredWidth / 2,
                            horizontalMargin
                        ),
                        screenWidth - desiredWidth - horizontalMargin
                    );
                }
            } else {
                computedLeft = Math.min(
                    Math.max(computedLeft, horizontalMargin),
                    screenWidth - desiredWidth - horizontalMargin
                );
            }
        }

        const finalContainerStyle = {
            ...containerStyle,
            position: 'absolute',
            left: computedLeft,
            top: computedTop,
        };

        computedContainerStyle = finalContainerStyle;
    } else {
        computedContainerStyle = [styles.miniModalContainer, containerStyle];
    }

    return (
        <Portal>
            <View
                ref={modalRef}
                style={[computedContainerStyle, { pointerEvents: 'auto' }]}
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
