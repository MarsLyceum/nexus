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
    // Outer pan responder tracking.
    const outerStartOffset = useRef<number>(0);
    // Track whether the modal is fully expanded.
    const [modalExpanded, setModalExpanded] = useState(false);

    // ---------------------------
    // Custom inner scroll variables
    // ---------------------------
    function clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(value, max));
    }
    // innerScrollY holds our animated scroll offset.
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
    // Outer PanResponder for the bottom sheet
    // ---------------------------
    const panResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: (evt, gestureState) => {
                    if (modalExpanded) return false;
                    return (
                        Math.abs(gestureState.dy) > 10 &&
                        // Only engage if inner scroll is at top (logic could be enhanced in production)
                        gestureState.dy > 0
                    );
                },
                onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
                    if (modalExpanded) return false;
                    return (
                        Math.abs(gestureState.dy) > 10 && gestureState.dy > 0
                    );
                },
                onPanResponderGrant: () => {
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
                    let newSheetPosition = clamp(
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

    // ---------------------------
    // Inner PanResponder for the custom scroll view
    // ---------------------------
    const innerPanResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: (evt, gestureState) =>
                    Math.abs(gestureState.dy) > 2,
                onPanResponderGrant: () => {
                    // Record the current persistent offset.
                    innerScrollY.setOffset(innerScrollYOffset.current);
                    innerScrollY.setValue(0);
                },
                onPanResponderMove: (evt, gestureState) => {
                    // Calculate new absolute offset from the starting offset and gesture's dy.
                    let newOffset =
                        innerScrollYOffset.current - gestureState.dy;
                    // Calculate maximum scrollable offset using the visible scrollable height.
                    const maxScroll = Math.max(
                        contentHeight - visibleContainerHeight,
                        0
                    );
                    // Clamp the new offset between 0 and maxScroll
                    newOffset = clamp(newOffset, 0, maxScroll);
                    // Set the animated value as the difference between clamped offset and persistent offset.
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
        [contentHeight, visibleContainerHeight]
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
                {...panResponder.panHandlers}
                style={[styles.bottomSheetContainer, { top: topAnim }]}
            >
                <Animated.View style={styles.handleBarContainer}>
                    <View style={styles.handleBar} />
                </Animated.View>
                {/* Inner custom scroll container */}
                {/* Removed the onLayout here since we now compute the visible height */}
                <View style={{ flex: 1, overflow: 'hidden' }}>
                    <Animated.View
                        {...innerPanResponder.panHandlers}
                        // Apply the transformation: content moves opposite to the scroll offset.
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
