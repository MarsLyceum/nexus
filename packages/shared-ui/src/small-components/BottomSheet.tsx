// BottomSheet.tsx
import React, { useMemo, useEffect, useRef, useState } from 'react';
import {
    Animated,
    PanResponder,
    Dimensions,
    Modal,
    TouchableOpacity,
    View,
    StyleSheet,
    Easing,
} from 'react-native';

import { useTheme, Theme } from '../theme';

export type BottomSheetProps = {
    visible: boolean;
    onClose: () => void;
    children: React.ReactNode;
};

export const BottomSheet = ({
    visible,
    onClose,
    children,
}: BottomSheetProps) => {
    const screenHeight = Dimensions.get('window').height;
    const { theme } = useTheme();
    // Define snap points
    const SNAP_COLLAPSED = screenHeight - 400; // Partially open position
    const SNAP_EXPANDED = screenHeight * 0.3; // Fully expanded position (top at 30% of screen)
    const SNAP_CLOSED = screenHeight; // Off-screen

    // Animated value for the bottom sheet’s vertical position.
    const topAnim = useRef(new Animated.Value(SNAP_CLOSED)).current;
    const [modalExpanded, setModalExpanded] = useState(false);

    // Utility function to clamp values.
    function clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(value, max));
    }

    // Inner scroll variables
    const innerScrollY = useRef(new Animated.Value(0)).current;
    const innerScrollYOffset = useRef(0);
    const [contentHeight, setContentHeight] = useState<number>(0);

    const visibleContainerHeight = useMemo(
        () => screenHeight - (modalExpanded ? SNAP_EXPANDED : SNAP_COLLAPSED),
        [modalExpanded, screenHeight]
    );

    // Outer PanResponder for dragging the bottom sheet.
    const outerStartOffset = useRef<number>(0);
    const outerPanResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: (evt, gestureState) => {
                    if (modalExpanded) {
                        // Only take over if dragging down and inner scroll is at top.
                        if (
                            gestureState.dy > 10 &&
                            innerScrollYOffset.current === 0
                        ) {
                            return true;
                        }
                        return false;
                    }
                    return Math.abs(gestureState.dy) > 10;
                },
                onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
                    if (modalExpanded) {
                        if (
                            gestureState.dy > 10 &&
                            innerScrollYOffset.current === 0
                        ) {
                            return true;
                        }
                        return false;
                    }
                    return Math.abs(gestureState.dy) > 10;
                },
                onPanResponderGrant: () => {
                    // eslint-disable-next-line no-underscore-dangle
                    outerStartOffset.current = topAnim.__getValue();
                },
                onPanResponderMove: (evt, gestureState) => {
                    let newSheetPosition =
                        outerStartOffset.current + gestureState.dy;
                    newSheetPosition = clamp(
                        newSheetPosition,
                        SNAP_EXPANDED,
                        SNAP_CLOSED
                    );
                    topAnim.setValue(newSheetPosition);
                },
                onPanResponderRelease: (evt, gestureState) => {
                    const newSheetPosition = clamp(
                        outerStartOffset.current + gestureState.dy,
                        SNAP_EXPANDED,
                        SNAP_CLOSED
                    );
                    const midpoint = (SNAP_COLLAPSED + SNAP_EXPANDED) / 2;
                    if (newSheetPosition < midpoint) {
                        Animated.spring(topAnim, {
                            toValue: SNAP_EXPANDED,
                            useNativeDriver: false,
                        }).start(() => {
                            setModalExpanded(true);
                        });
                    } else if (newSheetPosition > SNAP_COLLAPSED + 50) {
                        Animated.timing(topAnim, {
                            toValue: SNAP_CLOSED,
                            duration: 200,
                            easing: Easing.in(Easing.ease),
                            useNativeDriver: false,
                        }).start(() => {
                            onClose();
                            setModalExpanded(false);
                        });
                    } else {
                        Animated.spring(topAnim, {
                            toValue: SNAP_COLLAPSED,
                            useNativeDriver: false,
                        }).start(() => {
                            setModalExpanded(false);
                        });
                    }
                },
            }),
        [
            modalExpanded,
            topAnim,
            SNAP_COLLAPSED,
            SNAP_EXPANDED,
            SNAP_CLOSED,
            onClose,
        ]
    );

    // Inner PanResponder for the scrollable area.
    const innerPanResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => modalExpanded,
                onMoveShouldSetPanResponder: (evt, gestureState) =>
                    modalExpanded && Math.abs(gestureState.dy) > 2,
                onPanResponderGrant: () => {
                    innerScrollY.setOffset(innerScrollYOffset.current);
                    innerScrollY.setValue(0);
                },
                onPanResponderMove: (evt, gestureState) => {
                    let newOffset =
                        innerScrollYOffset.current - gestureState.dy;
                    const maxScroll =
                        Math.max(contentHeight - visibleContainerHeight, 0) +
                        20;
                    newOffset = clamp(newOffset, 0, maxScroll);
                    innerScrollY.setValue(
                        newOffset - innerScrollYOffset.current
                    );
                },
                onPanResponderRelease: () => {
                    innerScrollY.flattenOffset();
                    // eslint-disable-next-line no-underscore-dangle
                    innerScrollYOffset.current = innerScrollY.__getValue();
                },
                onPanResponderTerminate: () => {
                    innerScrollY.flattenOffset();
                },
            }),
        [modalExpanded, contentHeight, visibleContainerHeight, innerScrollY]
    );

    // Watch visibility changes to trigger opening/closing animations.
    useEffect(() => {
        if (visible) {
            Animated.timing(topAnim, {
                toValue: SNAP_COLLAPSED,
                duration: 300,
                easing: Easing.out(Easing.ease),
                useNativeDriver: false,
            }).start(() => setModalExpanded(false));
        } else {
            Animated.timing(topAnim, {
                toValue: SNAP_CLOSED,
                duration: 250,
                easing: Easing.in(Easing.ease),
                useNativeDriver: false,
            }).start(() => setModalExpanded(false));
        }
    }, [visible, topAnim, SNAP_COLLAPSED, SNAP_CLOSED]);

    const styles = useMemo(
        () => createStyles(theme, screenHeight),
        [screenHeight, theme]
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                onPress={() => {
                    Animated.timing(topAnim, {
                        toValue: SNAP_CLOSED,
                        duration: 200,
                        useNativeDriver: false,
                    }).start(() => onClose());
                    setModalExpanded(false);
                }}
                activeOpacity={1}
            >
                <View />
            </TouchableOpacity>
            <Animated.View
                {...outerPanResponder.panHandlers}
                style={[styles.bottomSheetContainer, { top: topAnim }]}
            >
                <View style={styles.handleBarContainer}>
                    <View style={styles.handleBar} />
                </View>
                <View style={{ flex: 1, overflow: 'hidden' }}>
                    <Animated.View
                        {...innerPanResponder.panHandlers}
                        style={{
                            transform: [
                                {
                                    translateY: Animated.multiply(
                                        innerScrollY,
                                        -1
                                    ),
                                },
                            ],
                        }}
                        onLayout={(evt) =>
                            setContentHeight(evt.nativeEvent.layout.height)
                        }
                    >
                        {children}
                    </Animated.View>
                </View>
            </Animated.View>
        </Modal>
    );
};

function createStyles(theme: Theme, screenHeight: number) {
    return StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
        },
        bottomSheetContainer: {
            position: 'absolute',
            left: 0,
            right: 0,
            height: screenHeight,
            backgroundColor: theme.colors.PrimaryBackground,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
        },
        handleBarContainer: {
            alignItems: 'center',
            paddingVertical: 16,
        },
        handleBar: {
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: theme.colors.ActiveText,
        },
    });
}
