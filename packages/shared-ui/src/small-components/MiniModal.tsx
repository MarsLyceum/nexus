import React from 'react';
import {
    View,
    TouchableWithoutFeedback,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { Portal } from 'react-native-paper';
import { COLORS } from '../constants';

export type MiniModalProps = {
    visible: boolean;
    onClose: () => void;
    containerStyle?: object;
    // Anchor position holds the layout (x, y, width, height) of the target element.
    anchorPosition?: { x: number; y: number; width: number; height: number };
    children: React.ReactNode;
};

export const MiniModal: React.FC<MiniModalProps> = ({
    visible,
    onClose,
    containerStyle,
    anchorPosition,
    children,
}) => {
    if (!visible) return null;

    let computedContainerStyle;

    if (anchorPosition) {
        // 1. Get screen dimensions.
        const { width: screenWidth, height: screenHeight } =
            Dimensions.get('window');
        // 2. Get desired modal dimensions from containerStyle or use defaults.
        const desiredWidth =
            (containerStyle && (containerStyle as any).width) || 350;
        const desiredHeight =
            (containerStyle && (containerStyle as any).maxHeight) || 250;
        // 3. Calculate margins and offset.
        const horizontalMargin = screenWidth * 0.02;
        const verticalMargin = screenHeight * 0.02;
        const offset = 20; // Offset between anchor and modal.

        // 3.1 Compute available spaces around the anchor.
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

        // 3.2 Check if the modal fully fits in each direction.
        const fitsAbove = availableAbove >= desiredHeight;
        const fitsBelow = availableBelow >= desiredHeight;
        const fitsRight = availableRight >= desiredWidth;
        const fitsLeft = availableLeft >= desiredWidth;

        let computedLeft;
        let computedTop;

        // 4. If modal doesn't fully fit in any direction, use fallback.
        if (!fitsAbove && !fitsBelow && !fitsRight && !fitsLeft) {
            // Compute ratio of available space to desired dimension for each direction.
            const ratioAbove = availableAbove / desiredHeight;
            const ratioBelow = availableBelow / desiredHeight;
            const ratioRight = availableRight / desiredWidth;
            const ratioLeft = availableLeft / desiredWidth;
            // Choose the best direction based on highest ratio.
            const ratios = [
                { direction: 'above', ratio: ratioAbove },
                { direction: 'below', ratio: ratioBelow },
                { direction: 'right', ratio: ratioRight },
                { direction: 'left', ratio: ratioLeft },
            ];
            const best = ratios.reduce((prev, curr) =>
                curr.ratio > prev.ratio ? curr : prev
            );

            // Based on best direction, position the modal at the edge of available space.
            if (best.direction === 'above') {
                computedTop = verticalMargin; // align with top margin
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
                computedTop = screenHeight - desiredHeight - verticalMargin; // align with bottom margin
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
                computedLeft = screenWidth - desiredWidth - horizontalMargin; // align with right margin
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
                computedLeft = horizontalMargin; // align with left margin
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
            // 4. Default placement: try placing above the anchor.
            computedLeft =
                anchorPosition.x + anchorPosition.width / 2 - desiredWidth / 2;
            computedTop = anchorPosition.y - desiredHeight - offset;

            // 5. Check if there is enough space above.
            if (computedTop < verticalMargin) {
                // Not enough space above; try placing below the anchor.
                computedTop = anchorPosition.y + anchorPosition.height + offset;

                // 6. Check if placing below overflows the screen.
                if (
                    computedTop + desiredHeight >
                    screenHeight - verticalMargin
                ) {
                    // Not enough vertical space below, so try positioning on the right.
                    computedLeft =
                        anchorPosition.x + anchorPosition.width + offset;
                    // 7. Check if there is enough space on the right.
                    if (
                        computedLeft + desiredWidth >
                        screenWidth - horizontalMargin
                    ) {
                        // Not enough space on the right; try placing on the left.
                        computedLeft = anchorPosition.x - desiredWidth - offset;
                        // If left still doesn’t work, fallback to centering horizontally.
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
                    // 8. For side placements, center vertically relative to the anchor.
                    computedTop =
                        anchorPosition.y +
                        anchorPosition.height / 2 -
                        desiredHeight / 2;
                    computedTop = Math.min(
                        Math.max(computedTop, verticalMargin),
                        screenHeight - desiredHeight - verticalMargin
                    );
                } else {
                    // 9. If below works, clamp horizontal position to screen boundaries.
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
                // 10. If above works, just clamp the horizontal position.
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
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlayWrapper}>
                    <TouchableWithoutFeedback>
                        <View style={computedContainerStyle}>{children}</View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Portal>
    );
};

const styles = StyleSheet.create({
    overlayWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
    },
    miniModalContainer: {
        position: 'absolute',
        left: '50%',
        bottom: 70, // Default positioning if no anchor is provided.
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
