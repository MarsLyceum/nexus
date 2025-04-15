import React, { useMemo, useEffect, useRef, useState } from 'react';
import {
    Animated,
    PanResponder,
    Dimensions,
    Modal,
    TouchableOpacity,
    View,
    Text,
    StyleSheet,
    Easing,
} from 'react-native';
import { useTheme, Theme } from '../theme';
import { Edit, Delete } from '../icons';

/*
   Type definition for the bottom sheet props.
   (Includes onApps and onMention for additional actions)
*/
export type MessageOptionsBottomSheetProps = {
    visible: boolean;
    onClose: () => void;
    onEdit: () => void;
    onReply: () => void;
    onForward: () => void;
    onCreateThread: () => void;
    onCopyText: () => void;
    onMarkUnread: () => void;
    onPinMessage: () => void;
    onApps: () => void;
    onMention: () => void;
    onCopyMessageLink: () => void;
    onRemoveEmbed: () => void;
    onDeleteMessage: () => void;
};

export function MessageOptionsBottomSheet({
    visible,
    onClose,
    onEdit,
    onReply,
    onForward,
    onCreateThread,
    onCopyText,
    onMarkUnread,
    onPinMessage,
    onApps,
    onMention,
    onCopyMessageLink,
    onRemoveEmbed,
    onDeleteMessage,
}: MessageOptionsBottomSheetProps) {
    const { theme } = useTheme();
    const screenHeight = Dimensions.get('window').height;
    // Define snap points:
    const SNAP_COLLAPSED = screenHeight - 400; // Partially open position
    const SNAP_EXPANDED = screenHeight * 0.3; // Fully expanded: top is at 30% of screen height
    const SNAP_CLOSED = screenHeight; // Off-screen

    // Animated value for the bottom sheet's vertical position.
    const topAnim = useRef(new Animated.Value(SNAP_CLOSED)).current;
    // Track whether the modal is fully expanded.
    const [modalExpanded, setModalExpanded] = useState(false);

    // ---------------------------
    // Utility function to clamp values.
    // ---------------------------
    function clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(value, max));
    }

    // ---------------------------
    // Custom inner scroll variables
    // ---------------------------
    // innerScrollY holds our animated scroll offset (delta value during a gesture).
    const innerScrollY = useRef(new Animated.Value(0)).current;
    // Persistent storage for the inner scroll offset.
    const innerScrollYOffset = useRef(0);

    // For measuring scrollable content size.
    const [contentHeight, setContentHeight] = useState<number>(0);

    // Compute the visible container height based on snap position.
    // When collapsed: visible height = screenHeight - SNAP_COLLAPSED (i.e. 400).
    // When expanded: visible height = screenHeight - SNAP_EXPANDED.
    const visibleContainerHeight = useMemo(() => {
        return screenHeight - (modalExpanded ? SNAP_EXPANDED : SNAP_COLLAPSED);
    }, [modalExpanded, screenHeight]);

    // ---------------------------
    // Outer PanResponder for the bottom sheet drag
    // ---------------------------
    // This pan responder is attached to the overall bottom sheet container.
    // It handles the gestures when the sheet is not fully expanded,
    // and in the expanded state it handles downward drags when the inner scroll is at zero.
    const outerStartOffset = useRef<number>(0);
    const outerPanResponder = useMemo(
        () =>
            PanResponder.create({
                // Always want to be the responder if the touch occurs on non-scroll areas.
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: (evt, gestureState) => {
                    if (modalExpanded) {
                        // When expanded, only take over if dragging down and inner scroll is at top.
                        if (
                            gestureState.dy > 10 &&
                            innerScrollYOffset.current === 0
                        ) {
                            return true;
                        }
                        return false;
                    }
                    // When not expanded, any significant move should drag the sheet.
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
                    outerStartOffset.current = topAnim.__getValue();
                },
                onPanResponderMove: (evt, gestureState) => {
                    // Calculate the new sheet position using the outer gesture delta.
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

    // ---------------------------
    // Inner PanResponder for the custom scroll view
    // ---------------------------
    // This pan responder is attached to the custom scrollable area.
    // It becomes active only when the sheet is fully expanded.
    // While active, it updates the inner scroll offset.
    const innerPanResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => modalExpanded,
                onMoveShouldSetPanResponder: (evt, gestureState) =>
                    modalExpanded && Math.abs(gestureState.dy) > 2,
                onPanResponderGrant: () => {
                    // Set the starting scroll offset.
                    innerScrollY.setOffset(innerScrollYOffset.current);
                    innerScrollY.setValue(0);
                },
                onPanResponderMove: (evt, gestureState) => {
                    let newOffset =
                        innerScrollYOffset.current - gestureState.dy;
                    const maxScroll = Math.max(
                        contentHeight - visibleContainerHeight,
                        0
                    );
                    newOffset = clamp(newOffset, 0, maxScroll);
                    innerScrollY.setValue(
                        newOffset - innerScrollYOffset.current
                    );
                },
                onPanResponderRelease: () => {
                    innerScrollY.flattenOffset();
                    innerScrollYOffset.current = innerScrollY.__getValue();
                },
                onPanResponderTerminate: () => {
                    innerScrollY.flattenOffset();
                },
            }),
        [modalExpanded, contentHeight, visibleContainerHeight, innerScrollY]
    );

    // ---------------------------
    // useEffect for visibility changes
    // ---------------------------
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
        [theme, screenHeight]
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
            {/* The outer pan responder is attached here so that the entire bottom sheet container
                (including areas outside the custom scroll view) can respond to drag gestures. */}
            <Animated.View
                {...outerPanResponder.panHandlers}
                style={[styles.bottomSheetContainer, { top: topAnim }]}
            >
                <Animated.View style={styles.handleBarContainer}>
                    <View style={styles.handleBar} />
                </Animated.View>
                {/* The custom scroll container now uses the inner pan responder.
                    This area will handle scroll gestures once the sheet is fully expanded. */}
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
                        <View style={styles.reactionsRow}>
                            <TouchableOpacity style={styles.reactionButton}>
                                <Text style={styles.reactionText}>👍</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.reactionButton}>
                                <Text style={styles.reactionText}>💯</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.reactionButton}>
                                <Text style={styles.reactionText}>😆</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.reactionButton}>
                                <Text style={styles.reactionText}>😐</Text>
                            </TouchableOpacity>
                        </View>
                        <MenuItem
                            label="Edit Message"
                            icon={<Edit />}
                            onPress={onEdit}
                            theme={theme}
                        />
                        <MenuItem
                            label="Reply"
                            onPress={onReply}
                            theme={theme}
                        />
                        <MenuItem
                            label="Forward"
                            onPress={onForward}
                            theme={theme}
                        />
                        <MenuItem
                            label="Create Thread"
                            onPress={onCreateThread}
                            theme={theme}
                        />
                        <MenuItem
                            label="Copy Text"
                            onPress={onCopyText}
                            theme={theme}
                        />
                        <MenuItem
                            label="Mark Unread"
                            onPress={onMarkUnread}
                            theme={theme}
                        />
                        <MenuItem
                            label="Pin Message"
                            onPress={onPinMessage}
                            theme={theme}
                        />
                        <MenuItem label="Apps" onPress={onApps} theme={theme} />
                        <MenuItem
                            label="Mention"
                            onPress={onMention}
                            theme={theme}
                        />
                        <MenuItem
                            label="Copy Message Link"
                            onPress={onCopyMessageLink}
                            theme={theme}
                        />
                        <View style={styles.destructiveContainer}>
                            <MenuItem
                                label="Remove Embed"
                                onPress={onRemoveEmbed}
                                theme={theme}
                                destructive
                            />
                            <MenuItem
                                label="Delete Message"
                                icon={<Delete />}
                                onPress={onDeleteMessage}
                                theme={theme}
                                destructive
                            />
                        </View>
                    </Animated.View>
                </View>
            </Animated.View>
        </Modal>
    );
}

export function MenuItem({
    label,
    icon,
    onPress,
    theme,
    destructive = false,
}: {
    label: string;
    icon?: React.ReactNode;
    onPress: () => void;
    theme: Theme;
    destructive?: boolean;
}) {
    const styles = useMemo(
        () => createMenuItemStyles(theme, destructive),
        [theme, destructive]
    );
    return (
        <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
            <View style={styles.iconContainer}>{icon}</View>
            <Text style={styles.labelText}>{label}</Text>
        </TouchableOpacity>
    );
}

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
            backgroundColor: theme.colors.InactiveText,
        },
        reactionsRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
            paddingHorizontal: 16,
        },
        reactionButton: {
            marginRight: 12,
        },
        reactionText: {
            fontSize: 20,
            color: theme.colors.ActiveText,
        },
        destructiveContainer: {
            marginTop: 16,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.colors.InactiveText,
            paddingTop: 8,
            paddingHorizontal: 16,
            marginBottom: 32,
        },
    });
}

function createMenuItemStyles(theme: Theme, destructive: boolean) {
    return StyleSheet.create({
        itemContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.colors.InactiveText,
            backgroundColor: theme.colors.PrimaryBackground,
        },
        iconContainer: {
            marginRight: 12,
        },
        labelText: {
            fontSize: 15,
            color: destructive ? theme.colors.Error : theme.colors.ActiveText,
        },
    });
}
