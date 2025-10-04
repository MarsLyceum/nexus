import React, {
    useState,
    useRef,
    useEffect,
    useLayoutEffect,
    useCallback,
    useMemo,
} from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable as RNPressable,
    Platform,
    LayoutChangeEvent,
    Animated,
    Easing,
} from 'react-native';
import {
    Pressable as RNGHPressable,
    Gesture,
    GestureDetector,
} from 'react-native-gesture-handler';

import { useTheme, Theme } from '../theme';
import { MessageContent, MessageEditor } from './message';
import { formatDateForChat, toRgba } from '../utils';
import { resolveHoverBounds, measureNativeView } from '../utils/hoverBounds';
import { isStableHoverGroupMember } from '../utils/stableHoverGroup';
import type { MessageWithAvatar, DirectMessageWithAvatar } from '../types';
import { useIsComputer, useStableHover } from '../hooks';
import {
    BorderRadius,
    Spacing,
    Typography,
    Opacity,
} from '../constants/designSystem';

import { MessageOptionsBottomSheet } from './MessageOptionsBottomSheet';
import { MessageOptionsModal } from './MessageOptionsModal';
import { MoreOptionsMenu } from './MoreOptionsMenu';
import { DeleteMessageConfirmationModal } from './DeleteMessageConfirmationModal';
import { NexusImage } from './NexusImage';

const Pressable = Platform.OS === 'web' ? RNPressable : RNGHPressable;

export type MessageItemProps = {
    message: MessageWithAvatar | DirectMessageWithAvatar;
    width: number;
    onAttachmentPress: (attachments: string[], index: number) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scrollContainerRef: React.RefObject<any>;
    onSaveEdit: (message: MessageWithAvatar | DirectMessageWithAvatar) => void;
    onDeleteMessage: (
        message: DirectMessageWithAvatar | MessageWithAvatar
    ) => void;
    onLayout?: (event: LayoutChangeEvent) => void;
    contentHeight?: number;
};

const getMessageDate = (
    message: MessageWithAvatar | DirectMessageWithAvatar
    // @ts-expect-error message
): Date => message.postedAt ?? new Date(message.createdAt);

export const MessageItem: React.FC<MessageItemProps> = ({
    message,
    width,
    onAttachmentPress,
    scrollContainerRef,
    onSaveEdit,
    onDeleteMessage,
    onLayout,
    contentHeight,
}) => {
    const isComputer = useIsComputer();
    const [currentMessage, setCurrentMessage] = useState(message);
    const [optionsModalVisible, setOptionsModalVisible] = useState(false);
    const [bottomSheetVisible, setBottomSheetVisible] =
        useState<boolean>(false);

    const [anchorPosition, setAnchorPosition] = useState<
        | {
              x: number;
              y: number;
              width: number;
              height: number;
          }
        | undefined
    >(undefined);
    const [modalHovered, setModalHovered] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(
        currentMessage.content ?? ''
    );
    const pressableRef = useRef<View>(null);
    const containerRef = useRef<View>(null);
    const lastInteractiveRectRef = useRef<DOMRect | null>(null);
    const messageDate = getMessageDate(currentMessage);
    const entranceProgress = useRef(new Animated.Value(0)).current;
    const hoverProgress = useRef(new Animated.Value(0)).current;
    const logHoverEvent = useCallback(
        (label: string, details: Record<string, unknown> = {}) => {
            if (__DEV__) {
                // eslint-disable-next-line no-console
                console.log(`[MessageItem:${message.id}] ${label}`, details);
            }
        },
        [message.id]
    );
    const [showMoreOptions, setShowMoreOptions] = useState(false);
    const [moreButtonAnchor, setMoreButtonAnchor] = useState<
        | {
              x: number;
              y: number;
              width: number;
              height: number;
          }
        | undefined
    >();
    const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] =
        useState(false);
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const handleDeleteMessageConfirm = useCallback(() => {
        onDeleteMessage(currentMessage);
        setShowDeleteConfirmationModal(false);
    }, [currentMessage, onDeleteMessage]);

    const handleDeleteMessage = useCallback(() => {
        setBottomSheetVisible(false);
        setShowDeleteConfirmationModal(true);
    }, []);

    const getInteractiveRect = useCallback(() => {
        if (Platform.OS !== 'web') {
            logHoverEvent('interactive-rect-non-web');
            return null;
        }

        const candidateRefs = [containerRef, pressableRef] as const;

        for (const ref of candidateRefs) {
            const candidateLabel =
                ref === containerRef ? 'container' : 'pressable';
            const rect = resolveHoverBounds({
                viewRef: ref,
                fallbackRectRef: lastInteractiveRectRef,
            });

            if (rect) {
                lastInteractiveRectRef.current = rect;
                logHoverEvent('interactive-rect-resolved', {
                    candidate: candidateLabel,
                    width: rect.width,
                    height: rect.height,
                });
                return rect;
            }

            logHoverEvent('interactive-rect-miss', {
                candidate: candidateLabel,
                hasRef: Boolean(ref.current),
                hasProps: Boolean(ref.current?.props),
            });
        }

        if (lastInteractiveRectRef.current) {
            logHoverEvent('interactive-node-using-fallback', {
                width: lastInteractiveRectRef.current.width,
                height: lastInteractiveRectRef.current.height,
            });
            return lastInteractiveRectRef.current;
        }

        logHoverEvent('interactive-node-not-found');
        return null;
    }, [logHoverEvent]);

    const handleLongPress = useCallback((): void => {
        setBottomSheetVisible(true);
    }, []);

    useLayoutEffect(() => {
        if (Platform.OS !== 'web') {
            return undefined;
        }

        if (!pressableRef.current) {
            logHoverEvent('measure-native-view-missing-pressable');
            return undefined;
        }

        const handleMeasured = (rect: DOMRect) => {
            if (rect.width > 0 && rect.height > 0) {
                lastInteractiveRectRef.current = rect;
                logHoverEvent('measure-native-view', {
                    width: rect.width,
                    height: rect.height,
                });
                return;
            }

            logHoverEvent('measure-native-view-skipped', {
                width: rect.width,
                height: rect.height,
            });
        };

        measureNativeView(pressableRef, handleMeasured);

        return undefined;
    }, [logHoverEvent, pressableRef]);

    // Measure the container and set the anchor based on its top-right edge.
    const showModal = useCallback(() => {
        const rect = getInteractiveRect();
        if (!rect) {
            logHoverEvent('show-modal-missing-rect');
            return;
        }
        const margin = 10;
        const computedAnchor = {
            x: rect.right - margin,
            y: rect.top + margin,
            width: rect.width,
            height: rect.height,
        };
        logHoverEvent('show-modal-anchor', computedAnchor);
        setAnchorPosition(computedAnchor);
        setOptionsModalVisible(true);
    }, [getInteractiveRect, logHoverEvent]);

    const animateHover = useCallback(
        (toValue: number) => {
            Animated.timing(hoverProgress, {
                toValue,
                duration: 180,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }).start();
        },
        [hoverProgress]
    );

    const handleHoverEnter = useCallback(() => {
        logHoverEvent('hover-enter');
        animateHover(1);
        showModal();
    }, [animateHover, logHoverEvent, showModal]);

    const handleHoverLeave = useCallback(() => {
        logHoverEvent('hover-leave');
        animateHover(0);
        setOptionsModalVisible(false);
    }, [animateHover, logHoverEvent]);

    const {
        handlers: hoverHandlers,
        isHovering,
        registerBounds,
    } = useStableHover({
        closeDelayMs: 160,
        leaveGapMs: 96,
        onEnter: handleHoverEnter,
        onLeave: handleHoverLeave,
        debugLabel: `message-${message.id}`,
        allowReentrantEnter: true,
    });

    const handleHoverIn = useCallback(() => {
        const result = hoverHandlers.onPointerEnter();
        logHoverEvent('handle-hover-in', { result });
    }, [hoverHandlers, logHoverEvent]);

    const handleScrollerLeave = useCallback(() => {
        logHoverEvent('handle-scroller-leave');
        hoverHandlers.onPointerLeave();
    }, [hoverHandlers, logHoverEvent]);

    const handleMouseLeave = useCallback(
        (event: ReactMouseEvent<View>) => {
            const nextTarget = event.relatedTarget;
            const possibleTarget = event.currentTarget;
            logHoverEvent('handle-mouse-leave', {
                hasRelatedTarget: Boolean(nextTarget),
                eventType: event.type,
            });
            if (!(possibleTarget instanceof Element)) {
                logHoverEvent('mouse-leave-non-element');
                hoverHandlers.onPointerLeave();
                return;
            }
            const currentTarget: Element = possibleTarget;
            const { clientX, clientY } = event.nativeEvent;
            const rect =
                typeof currentTarget.getBoundingClientRect === 'function'
                    ? currentTarget.getBoundingClientRect()
                    : undefined;
            const relatedSummary =
                nextTarget instanceof Element
                    ? {
                          nodeName: nextTarget.nodeName,
                          id: nextTarget.id,
                          className: nextTarget.className,
                      }
                    : { type: typeof nextTarget };
            logHoverEvent('mouse-leave-geometry', {
                clientX,
                clientY,
                rectTop: rect?.top,
                rectBottom: rect?.bottom,
                rectLeft: rect?.left,
                rectRight: rect?.right,
                rectWidth: rect?.width,
                rectHeight: rect?.height,
                currentContainsRelated:
                    nextTarget instanceof Element
                        ? currentTarget.contains(nextTarget)
                        : undefined,
                relatedSummary,
            });
            const containsRelated =
                nextTarget instanceof Element
                    ? isStableHoverGroupMember(nextTarget)
                    : undefined;
            const result = hoverHandlers.onPointerLeave({
                clientX,
                clientY,
                rect,
                containsRelated,
                relatedTarget:
                    nextTarget instanceof Element ? nextTarget : null,
            });
            logHoverEvent('mouse-leave-result', { result });
        },
        [hoverHandlers, logHoverEvent]
    );

    const hoverBindings = useMemo(() => {
        if (Platform.OS === 'web') {
            return {
                onMouseEnter: handleHoverIn,
                onMouseLeave: handleMouseLeave,
            } as const;
        }
        return {
            onHoverIn: handleHoverIn,
            onHoverOut: handleScrollerLeave,
        } as const;
    }, [handleHoverIn, handleMouseLeave, handleScrollerLeave]);

    useLayoutEffect(() => {
        if (Platform.OS !== 'web') {
            return undefined;
        }

        let needsFallback = false;

        registerBounds(() => {
            const rect = getInteractiveRect();
            logHoverEvent('register-bounds-attempt', {
                rectExists: Boolean(rect),
                lastWidth: lastInteractiveRectRef.current?.width,
                lastHeight: lastInteractiveRectRef.current?.height,
            });
            if (rect) {
                logHoverEvent('register-bounds', {
                    width: rect.width,
                    height: rect.height,
                    source: 'fresh',
                });
                return rect;
            }

            if (!needsFallback) {
                needsFallback = true;
                logHoverEvent('register-bounds', {
                    source: 'defer',
                });
                return undefined;
            }

            const lastRect = lastInteractiveRectRef.current ?? undefined;
            if (lastRect && lastRect.width > 0 && lastRect.height > 0) {
                logHoverEvent('register-bounds', {
                    width: lastRect.width,
                    height: lastRect.height,
                    source: 'cached',
                });
                needsFallback = false;
                return lastRect;
            }

            logHoverEvent('register-bounds', {
                source: 'missing',
            });
            needsFallback = false;
            return undefined;
        });

        return undefined;
    }, [getInteractiveRect, logHoverEvent, registerBounds]);

    useEffect(() => {
        if (!isHovering && !modalHovered) {
            logHoverEvent('effect-close-hover', {
                isHovering,
                modalHovered,
            });
            animateHover(0);
            setOptionsModalVisible(false);
        }
    }, [animateHover, isHovering, logHoverEvent, modalHovered]);

    useEffect(() => {
        const scrollContainerComponent = scrollContainerRef.current;
        if (!scrollContainerComponent) return undefined;
        const scrollContainer = scrollContainerComponent.getScrollableNode
            ? scrollContainerComponent.getScrollableNode()
            : scrollContainerComponent;
        if (
            !scrollContainer ||
            typeof scrollContainer.addEventListener !== 'function'
        ) {
            return undefined;
        }
        scrollContainer.addEventListener('scroll', handleScrollerLeave, {
            passive: true,
        });
        // eslint-disable-next-line consistent-return
        return () => {
            scrollContainer.removeEventListener('scroll', handleScrollerLeave);
        };
    }, [handleScrollerLeave, scrollContainerRef]);

    const handleEdit = () => {
        setOptionsModalVisible(false);
        setBottomSheetVisible(false);
        setIsEditing(true);
    };

    const handleMore = (anchor: {
        x: number;
        y: number;
        width: number;
        height: number;
    }) => {
        setMoreButtonAnchor(anchor);
        setShowMoreOptions(true);
    };

    function handleCloseMoreOptions() {
        setShowMoreOptions(false);
    }

    const handleSaveEdit = () => {
        const updatedMessage: MessageWithAvatar | DirectMessageWithAvatar = {
            ...currentMessage,
            content: editedContent,
            edited: true,
        };

        setCurrentMessage(updatedMessage);
        onSaveEdit(updatedMessage);
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditedContent(currentMessage.content ?? '');
        setIsEditing(false);
    };

    // Check if we have attachments
    const hasAttachments =
        currentMessage.attachmentUrls &&
        currentMessage.attachmentUrls.length > 0;

    const videoGesture = Gesture.Native().disallowInterruption(true);

    const sliderGesture = Gesture.Native().disallowInterruption(true);

    const longPressGesture = Gesture.LongPress()
        .onStart(() => handleLongPress())
        .requireExternalGestureToFail(videoGesture)
        .requireExternalGestureToFail(sliderGesture);

    const OuterElement = Platform.OS === 'web' ? View : GestureDetector;

    useEffect(() => {
        entranceProgress.stopAnimation();
        entranceProgress.setValue(0);
        Animated.spring(entranceProgress, {
            toValue: 1,
            damping: 18,
            stiffness: 210,
            mass: 0.8,
            useNativeDriver: true,
        }).start();
    }, [entranceProgress, message.id]);

    return (
        <OuterElement
            gesture={Gesture.Simultaneous(
                videoGesture,
                longPressGesture,
                sliderGesture
            )}
        >
            <Animated.View
                collapsable={false}
                style={[
                    styles.pressableContainer,
                    {
                        opacity: entranceProgress,
                        transform: [
                            {
                                translateY: entranceProgress.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [16, 0],
                                }),
                            },
                        ],
                    },
                ]}
            >
                <Pressable
                    ref={pressableRef}
                    {...hoverBindings}
                    onLayout={onLayout}
                    style={
                        contentHeight ? { minHeight: contentHeight } : undefined
                    }
                    className="message-item__pressable"
                >
                    <Animated.View
                        ref={containerRef}
                        style={[
                            styles.messageContainer,
                            {
                                borderWidth: hoverProgress.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [1, 1.5],
                                }),
                                borderColor: hoverProgress.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [
                                        toRgba(
                                            theme.colors.ActiveText,
                                            Opacity.BorderSubtle
                                        ),
                                        toRgba(
                                            theme.colors.Primary,
                                            Opacity.BorderMedium
                                        ),
                                    ],
                                }),
                                backgroundColor: hoverProgress.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [
                                        'transparent',
                                        toRgba(
                                            theme.colors.TertiaryBackground,
                                            0.92
                                        ),
                                    ],
                                }),
                                shadowOpacity: hoverProgress.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, Opacity.ElevatedBackdrop],
                                }),
                                shadowRadius: hoverProgress.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, BorderRadius.Small],
                                }),
                                marginHorizontal: -Spacing.XS,
                                marginVertical: -Spacing.XS,
                            },
                        ]}
                    >
                        <NexusImage
                            source={currentMessage.avatar}
                            style={styles.avatar}
                            width={40}
                            height={40}
                            alt="User avatar"
                        />
                        <View style={styles.innerContainer}>
                            <Text style={styles.userName}>
                                {currentMessage.username}{' '}
                                <Text style={styles.time}>
                                    {formatDateForChat(messageDate)}
                                </Text>
                            </Text>

                            {/* Content view section - always mounted, visibility controlled by style */}
                            <View
                                style={[
                                    styles.viewContainer,
                                    isEditing ? styles.hidden : styles.visible,
                                ]}
                            >
                                <MessageContent
                                    message={currentMessage}
                                    width={width}
                                    onAttachmentPress={onAttachmentPress}
                                    renderMessage
                                    renderLinkPreview
                                    renderAttachments
                                    videoGesture={videoGesture}
                                    sliderGesture={sliderGesture}
                                />
                            </View>

                            {/* Edit section - always mounted, visibility controlled by style */}
                            <View
                                style={[
                                    styles.editContainer,
                                    isEditing ? styles.visible : styles.hidden,
                                ]}
                            >
                                {/* Text editor */}
                                <MessageEditor
                                    initialContent={editedContent}
                                    width={width}
                                    onChange={setEditedContent}
                                    onSave={handleSaveEdit}
                                    onCancel={handleCancelEdit}
                                />

                                {/* Link previews with live updates */}
                                <View style={styles.linkPreviewsWhileEditing}>
                                    <MessageContent
                                        message={currentMessage}
                                        width={width}
                                        onAttachmentPress={onAttachmentPress}
                                        renderMessage={false}
                                        renderLinkPreview
                                        renderAttachments={false}
                                        contentOverride={editedContent}
                                    />
                                </View>

                                {/* Attachments section */}
                                {hasAttachments && (
                                    <View
                                        style={[
                                            styles.attachmentsWhileEditing,
                                            styles.clippedSection,
                                        ]}
                                    >
                                        <MessageContent
                                            message={currentMessage}
                                            width={width}
                                            onAttachmentPress={
                                                onAttachmentPress
                                            }
                                            renderMessage={false}
                                            renderLinkPreview={false}
                                            renderAttachments
                                        />
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Options modal */}
                        {!isEditing &&
                            (optionsModalVisible || showMoreOptions) &&
                            anchorPosition && (
                                <View style={styles.optionsModalContainer}>
                                    <MessageOptionsModal
                                        visible
                                        onClose={() =>
                                            setOptionsModalVisible(false)
                                        }
                                        anchorPosition={anchorPosition}
                                        onEdit={handleEdit}
                                        onMore={handleMore}
                                        onMouseEnterModal={() => {
                                            setModalHovered(true);
                                            hoverHandlers.onPointerEnter();
                                        }}
                                        onMouseLeaveModal={(event) => {
                                            setModalHovered(false);
                                            hoverHandlers.onPointerLeave({
                                                clientX: event.clientX,
                                                clientY: event.clientY,
                                                rect: event.currentTarget.getBoundingClientRect(),
                                                containsRelated:
                                                    event.relatedTarget instanceof
                                                    Element
                                                        ? event.currentTarget.contains(
                                                              event.relatedTarget
                                                          )
                                                        : undefined,
                                            });
                                        }}
                                    />
                                </View>
                            )}

                        {bottomSheetVisible && (
                            <MessageOptionsBottomSheet
                                visible={bottomSheetVisible}
                                onClose={() => setBottomSheetVisible(false)}
                                onEdit={handleEdit}
                                onReply={() => {
                                    // Add your reply functionality or logging here.
                                }}
                                onForward={() => {}}
                                onCreateThread={() => {}}
                                onCopyText={() => {}}
                                onMarkUnread={() => {}}
                                onPinMessage={() => {}}
                                onApps={() => {}}
                                onMention={() => {}}
                                onCopyMessageLink={() => {}}
                                onRemoveEmbed={() => {}}
                                onDeleteMessage={handleDeleteMessage}
                            />
                        )}

                        <MoreOptionsMenu
                            anchorPosition={moreButtonAnchor}
                            visible={showMoreOptions}
                            onClose={handleCloseMoreOptions}
                            onEdit={handleEdit}
                            onReply={() => {}}
                            onForward={() => {}}
                            onCreateThread={() => {}}
                            onAddReaction={() => {}}
                            onCopyText={() => {}}
                            onPinMessage={() => {}}
                            onMarkUnread={() => {}}
                            onCopyMessageLink={() => {}}
                            onDeleteMessage={handleDeleteMessage}
                        />

                        {showDeleteConfirmationModal && (
                            <DeleteMessageConfirmationModal
                                visible={showDeleteConfirmationModal}
                                onClose={() =>
                                    setShowDeleteConfirmationModal(false)
                                }
                                onConfirmDelete={handleDeleteMessageConfirm}
                                message={currentMessage}
                                onAttachmentPress={onAttachmentPress}
                            />
                        )}
                    </Animated.View>
                </Pressable>
            </Animated.View>
        </OuterElement>
    );
};

function createStyles(theme: Theme) {
    return StyleSheet.create({
        messageContainer: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            padding: Spacing.MD,
            width: '100%',
            position: 'relative',
            overflow: 'visible',
            borderRadius: BorderRadius.Medium,
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, Opacity.BorderSubtle),
        },
        pressableContainer: {
            flex: 1,
            borderRadius: BorderRadius.Medium,
            backgroundColor: toRgba(theme.colors.SecondaryBackground, 0.68),
            marginVertical: Spacing.XS,
            overflow: 'hidden',
            paddingHorizontal: Spacing.XS,
            paddingVertical: Spacing.XS,
        },
        avatar: {
            width: 40,
            height: 40,
            borderRadius: BorderRadius.Pill,
            marginRight: Spacing.SM,
        },
        innerContainer: {
            flex: 1,
            flexShrink: 1,
        },
        userName: {
            fontSize: Typography.BodySmall.fontSize,
            fontWeight: '700' as const,
            color: theme.colors.ActiveText,
        },
        time: {
            fontSize: Typography.Eyebrow.fontSize,
            color: toRgba(theme.colors.InactiveText, 0.7),
        },
        viewContainer: {
            // Container for normal viewing mode
        },
        editContainer: {
            // Container for edit mode components
        },
        linkPreviewsWhileEditing: {
            marginTop: Spacing.SM,
        },
        attachmentsWhileEditing: {
            marginTop: Spacing.SM,
        },
        clippedSection: {
            overflow: 'hidden',
            borderRadius: BorderRadius.Small,
        },
        optionsModalContainer: {
            position: 'absolute',
            zIndex: 100,
        },
        visible: {
            display: 'flex',
            opacity: 1,
        },
        hidden: {
            display: 'none',
            opacity: 0,
        },
    });
}
