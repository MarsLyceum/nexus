import React, {
    useState,
    useRef,
    useEffect,
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
    const messageDate = getMessageDate(currentMessage);
    const entranceProgress = useRef(new Animated.Value(0)).current;
    const hoverProgress = useRef(new Animated.Value(0)).current;
    const {
        handlers: hoverHandlers,
        isHovering,
        registerBounds,
        debugLabel,
    } = useStableHover({
        closeDelayMs: 320,
        onEnter: () => {
            animateHover(1);
            setOptionsModalVisible(true);
        },
        onLeave: () => {
            if (!modalHovered) {
                animateHover(0);
                setOptionsModalVisible(false);
            }
        },
        debugLabel: `message-${message.id}`,
    });
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

    const handleLongPress = useCallback((): void => {
        setBottomSheetVisible(true);
    }, []);

    // Measure the container and set the anchor based on its top-right edge.
    const showModal = useCallback(() => {
        if (isComputer && containerRef.current) {
            const rect = (
                containerRef.current as unknown as Element
            ).getBoundingClientRect();
            const margin = 10;
            // Compute the anchor as the top-right of the message (with a slight inset)
            const computedAnchor = {
                x: rect.right - margin,
                y: rect.top + margin,
                width: rect.width,
                height: rect.height,
            };
            setAnchorPosition(computedAnchor);
            setOptionsModalVisible(true);
        }
    }, [isComputer]);

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

    const handleHoverIn = useCallback(() => {
        if (__DEV__) {
            // eslint-disable-next-line no-console
            console.log(`[MessageItem:${message.id}] hover-in`, {
                isHovering,
                modalHovered,
            });
        }
        hoverHandlers.onPointerEnter();
        showModal();
    }, [hoverHandlers, isHovering, modalHovered, message.id, showModal]);

    const handleScrollerLeave = useCallback(() => {
        hoverHandlers.onPointerLeave();
        setOptionsModalVisible(false);
    }, [hoverHandlers]);

    const handleMouseLeave = useCallback(
        (event: ReactMouseEvent<View>) => {
            const nextTarget = event.relatedTarget as Node | null;
            const currentTarget = event.currentTarget as unknown as Node | null;
            if (
                currentTarget &&
                nextTarget &&
                currentTarget.contains(nextTarget)
            ) {
                return;
            }

            const rect = currentTarget?.getBoundingClientRect() ?? null;
            const { clientX, clientY } = event;
            if (
                rect &&
                clientX >= rect.left &&
                clientX <= rect.right &&
                clientY >= rect.top &&
                clientY <= rect.bottom
            ) {
                return;
            }

            if (__DEV__) {
                // eslint-disable-next-line no-console
                console.log(`[MessageItem:${message.id}] mouse-leave`, {
                    clientX,
                    clientY,
                });
            }
            hoverHandlers.onPointerLeave();
        },
        [hoverHandlers, message.id]
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

    useEffect(() => {
        if (!isComputer) {
            return undefined;
        }

        registerBounds(() => {
            if (Platform.OS !== 'web') {
                return undefined;
            }
            const element = (pressableRef.current ??
                containerRef.current) as unknown as Element | undefined;
            if (!element) {
                return undefined;
            }
            return element.getBoundingClientRect();
        });

        return undefined;
    }, [isComputer, registerBounds]);

    useEffect(() => {
        if (!isHovering && !modalHovered) {
            animateHover(0);
            setOptionsModalVisible(false);
        }
    }, [animateHover, isHovering, modalHovered]);

    useEffect(() => {
        const scrollContainerComponent = scrollContainerRef.current;
        if (!scrollContainerComponent) return;
        const scrollContainer = scrollContainerComponent.getScrollableNode
            ? scrollContainerComponent.getScrollableNode()
            : scrollContainerComponent;
        if (
            !scrollContainer ||
            typeof scrollContainer.addEventListener !== 'function'
        )
            return;
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
                                transform: [
                                    {
                                        translateY: hoverProgress.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0, -2],
                                        }),
                                    },
                                ],
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
                                        onMouseLeaveModal={() => {
                                            setModalHovered(false);
                                            hoverHandlers.onPointerLeave();
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
