// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/no-explicit-any */
/* MiniModal.tsx – original logic fully preserved, plus new `layout` prop
   that accepts any combination of: above | below | left | right      */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';

import { Portal } from '../providers';
import { useTheme, Theme } from '../theme';

/* ------------------------------------------------------------------ */
/*                               Types                                */
/* ------------------------------------------------------------------ */
type Primitive = 'above' | 'below' | 'left' | 'right';
type LayoutString =
    | Primitive
    | `${Primitive}-${Primitive}`
    | `${Primitive} ${Primitive}`; // "below-left" or "below left"

export type MiniModalProps = {
    visible: boolean;
    onClose: () => void;
    containerStyle?: object;
    anchorPosition?: { x: number; y: number; width: number; height: number };
    children: React.ReactNode;
    closeOnOutsideClick?: boolean;
    centered?: boolean;
    useRightAnchorAlignment?: boolean;
    /** NEW explicit position: e.g. "below-right", "left above" */
    layout?: LayoutString;
    gap?: number;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
};

/* ------------------------------------------------------------------ */
/*                             Component                              */
/* ------------------------------------------------------------------ */
export const MiniModal: React.FC<MiniModalProps> = ({
    visible,
    onClose,
    containerStyle,
    anchorPosition,
    children,
    closeOnOutsideClick = true,
    centered,
    useRightAnchorAlignment = false,
    layout,
    onMouseEnter,
    onMouseLeave,
    gap = 5,
}) => {
    const modalRef = useRef<View>(null);
    const [measuredHeight, setMeasuredHeight] = useState<number>();
    const [measuredWidth, setMeasuredWidth] = useState<number>();
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const flattenedContainerStyle = StyleSheet.flatten(containerStyle);

    /* -------------------------- outside click ----------------------- */
    useEffect(() => {
        if (!visible || !closeOnOutsideClick) return;
        if (Platform.OS === 'web') {
            const handleOutsideClick = (e: MouseEvent) => {
                if (
                    modalRef.current &&
                    !(modalRef.current as unknown as Element).contains(
                        e.target as Node
                    )
                )
                    onClose();
            };
            document.addEventListener('mousedown', handleOutsideClick, {
                passive: true,
            });
            return () =>
                document.removeEventListener('mousedown', handleOutsideClick);
        }
    }, [visible, closeOnOutsideClick, onClose]);

    if (!visible) return null;

    /* ------------------------------------------------------------------
          COMPUTE CONTAINER STYLE
       ------------------------------------------------------------------ */
    let computedContainerStyle: object;

    /* 1. Centered branch (unchanged) */
    if (centered) {
        const wantW = (flattenedContainerStyle as any)?.width ?? 420;
        const wantH = (flattenedContainerStyle as any)?.height ?? 200;
        const w = measuredWidth ?? wantW;
        const h = measuredHeight ?? wantH;
        computedContainerStyle = {
            ...flattenedContainerStyle,
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: [{ translateX: -w / 2 }, { translateY: -h / 2 }],
        };
    } else if (anchorPosition && layout) {
        /* 2. Explicit layout (NEW) */
        const tokens = layout
            .toLowerCase()
            .replace('-', ' ')
            .split(' ')
            .filter(Boolean) as Primitive[];

        const wants = {
            above: tokens.includes('above'),
            below: tokens.includes('below'),
            left: tokens.includes('left'),
            right: tokens.includes('right'),
        };

        const { width: vw, height: vh } = Dimensions.get('window');
        const wantW = (flattenedContainerStyle as any)?.width ?? 260;
        const wantH = (flattenedContainerStyle as any)?.maxHeight ?? 250;
        const w = measuredWidth ?? wantW;
        const h = measuredHeight ?? wantH;

        /* horizontal */
        let left = anchorPosition.x + anchorPosition.width / 2 - w / 2;
        if (wants.left) left = anchorPosition.x - w - gap;
        else if (wants.right)
            left = anchorPosition.x + anchorPosition.width + gap;

        /* vertical */
        let top = anchorPosition.y + anchorPosition.height / 2 - h / 2;
        if (wants.above) top = anchorPosition.y - h - gap;
        else if (wants.below)
            top = anchorPosition.y + anchorPosition.height + gap;

        /* clamp */
        left = Math.min(Math.max(left, 0), vw - w);
        top = Math.min(Math.max(top, 0), vh - h);

        computedContainerStyle = {
            ...flattenedContainerStyle,
            position: 'absolute',
            left,
            top,
        };
    } else if (anchorPosition && useRightAnchorAlignment) {
        /* 3. useRightAnchorAlignment branch (original, unchanged) */
        const { width: screenWidth } = Dimensions.get('window');
        const wantW = (flattenedContainerStyle as any)?.width ?? 260;
        const w = measuredWidth ?? wantW;
        let left = anchorPosition.x - w;
        left = Math.max(0, Math.min(left, screenWidth - w));
        const top = anchorPosition.y;
        computedContainerStyle = {
            ...flattenedContainerStyle,
            position: 'absolute',
            left,
            top,
        };
    } else if (anchorPosition) {
        /* 4. Original adaptive logic (entire block kept verbatim) */
        const { width: screenWidth, height: screenHeight } =
            Dimensions.get('window');
        const wantW = (flattenedContainerStyle as any)?.width ?? 350;
        const wantH = (flattenedContainerStyle as any)?.maxHeight ?? 250;
        const modalWidth = measuredWidth ?? wantW;
        const modalHeight = measuredHeight ?? wantH;

        const horizontalMargin = screenWidth * 0.02;
        const verticalMargin = screenHeight * 0.02;

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

        let computedLeft: number;
        let computedTop: number;

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
            // eslint-disable-next-line unicorn/no-array-reduce
            const best = ratios.reduce((prev, curr) =>
                curr.ratio > prev.ratio ? curr : prev
            );

            // eslint-disable-next-line default-case
            switch (best.direction) {
                case 'above': {
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
                    break;
                }
                case 'below': {
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
                    break;
                }
                case 'right': {
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
                    break;
                }
                case 'left': {
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
                    break;
                }
            }
        } else {
            computedLeft =
                anchorPosition.x + anchorPosition.width / 2 - modalWidth / 2;
            computedTop = anchorPosition.y - modalHeight - gap;
            if (computedTop < verticalMargin) {
                computedTop = anchorPosition.y + anchorPosition.height + gap;
                if (computedTop + modalHeight > screenHeight - verticalMargin) {
                    computedLeft =
                        anchorPosition.x + anchorPosition.width + gap;
                    if (
                        computedLeft + modalWidth >
                        screenWidth - horizontalMargin
                    ) {
                        computedLeft = anchorPosition.x - modalWidth - gap;
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
        computedTop = Math.max(
            // @ts-expect-error let
            Math.min(computedTop ?? 0, availableBottom - modalHeight),
            verticalMargin
        );

        computedContainerStyle = {
            ...flattenedContainerStyle,
            position: 'absolute',
            // @ts-expect-error let
            left: computedLeft,
            top: computedTop,
        };
    } else {
        /* 5. Fallback */
        computedContainerStyle = StyleSheet.flatten([
            styles.miniModalContainer,
            flattenedContainerStyle,
        ]);
    }

    /* ------------------------------------------------------------------ */
    /*                               Render                               */
    /* ------------------------------------------------------------------ */
    return (
        <Portal>
            {centered && <View style={styles.modalOverlay} />}
            <View
                ref={modalRef}
                style={[
                    computedContainerStyle,
                    { pointerEvents: 'auto', zIndex: 100 },
                ]}
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

/* ------------------------------------------------------------------ */
/*                               Styles                               */
/* ------------------------------------------------------------------ */
function createStyles(theme: Theme) {
    return StyleSheet.create({
        miniModalContainer: {
            position: 'absolute',
            left: '50%',
            bottom: 70,
            width: 350,
            maxHeight: 250,
            backgroundColor: theme.colors.PrimaryBackground,
            borderRadius: 8,
            padding: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
            transform: [{ translateX: -175 }],
        },
        modalOverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 50,
        },
    });
}
