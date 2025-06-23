import React, {
    useState,
    useRef,
    useEffect,
    useCallback,
    useMemo,
} from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable as RNPressable,
    Platform,
} from 'react-native';
import {
    Pressable as RNGHPressable,
    Gesture,
    GestureDetector,
} from 'react-native-gesture-handler';

import { useTheme, Theme } from '../theme';
import { ContentEditor } from './ContentEditor';
import { MessageContent } from './MessageContent';
import { formatDateForChat } from '../utils';
import type { MessageWithAvatar, DirectMessageWithAvatar } from '../types';
import { useIsComputer } from '../hooks';

import { MessageOptionsBottomSheet } from './MessageOptionsBottomSheet';
import { MessageOptionsModal } from './MessageOptionsModal';
import { MessageMoreOptionsMenu } from './MessageMoreOptionsMenu';
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
    const [isHovered, setIsHovered] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(
        currentMessage.content ?? ''
    );
    const containerRef = useRef<View>(null);
    const messageDate = getMessageDate(currentMessage);
    const hideModalTimeoutRef = useRef<number | null>(null);
    const scrollEndTimeoutRef = useRef<number | null>(null);
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
            const msgRect = (
                containerRef.current as unknown as Element
            ).getBoundingClientRect();

            const scrollNode = scrollContainerRef.current.getScrollableNode
                ? scrollContainerRef.current.getScrollableNode()
                : scrollContainerRef.current;
            const scrollEl = scrollNode as Element;
            const scrollRect = scrollEl.getBoundingClientRect();

            const margin = 10;
            const visibleTop = Math.max(msgRect.top, scrollRect.top);

            // Compute the anchor as the top-right of the message (with a slight inset)
            const computedAnchor = {
                x: msgRect.right - margin,
                y: visibleTop + margin,
                width: msgRect.width,
                height: msgRect.height,
            };
            setAnchorPosition(computedAnchor);
            setOptionsModalVisible(true);
        }
    }, [isComputer, scrollContainerRef]);

    const handleMouseEnter = () => {
        if (hideModalTimeoutRef.current) {
            clearTimeout(hideModalTimeoutRef.current);
            // eslint-disable-next-line unicorn/no-null
            hideModalTimeoutRef.current = null;
        }
        setIsHovered(true);
        if (!isScrolling) showModal();
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        hideModalTimeoutRef.current = setTimeout(() => {
            if (!modalHovered) {
                setOptionsModalVisible(false);
            }
        }, 300) as unknown as number;
    };

    // eslint-disable-next-line consistent-return
    useEffect(() => {
        const handleDocumentMouseMove = (e: MouseEvent) => {
            if (containerRef.current) {
                const rect = (
                    containerRef.current as unknown as Element
                ).getBoundingClientRect();
                const { clientX, clientY } = e;
                const isOverMessage =
                    clientX >= rect.left &&
                    clientX <= rect.right &&
                    clientY >= rect.top &&
                    clientY <= rect.bottom;

                if (!isOverMessage) {
                    setOptionsModalVisible(false);
                }
            }
        };

        // add listener only when we switch into "computer" mode
        if (isComputer && Platform.OS === 'web') {
            document.addEventListener('mousemove', handleDocumentMouseMove, {
                passive: true,
            });
        }

        // ALWAYS remove the listener on cleanup (unmount or isComputer toggle)
        return () => {
            if (Platform.OS === 'web') {
                document.removeEventListener(
                    'mousemove',
                    handleDocumentMouseMove
                );
            }
        };
    }, [isComputer]);

    useEffect(() => {
        const scrollContainerComponent = scrollContainerRef.current;
        if (!scrollContainerComponent) return;

        const scrollNode =
            'getScrollableNode' in scrollContainerComponent
                ? scrollContainerComponent.getScrollableNode()
                : scrollContainerComponent;
        if (!scrollNode || typeof scrollNode.addEventListener !== 'function')
            return;

        const handleScroll = () => {
            // any scroll: hide immediately
            setIsScrolling(true);
            setOptionsModalVisible(false);

            // clear pending “scroll end” callback
            if (scrollEndTimeoutRef.current) {
                clearTimeout(scrollEndTimeoutRef.current);
            }

            // debounce: 300ms after the *last* scroll event
            scrollEndTimeoutRef.current = globalThis.setTimeout(() => {
                setIsScrolling(false);
                // if the mouse is still over the message, re-open
                if (isHovered) {
                    showModal();
                }
            }, 300) as unknown as number;
        };

        scrollNode.addEventListener('scroll', handleScroll, { passive: true });

        // eslint-disable-next-line consistent-return
        return () => {
            scrollNode.removeEventListener('scroll', handleScroll);
            if (scrollEndTimeoutRef.current) {
                clearTimeout(scrollEndTimeoutRef.current);
            }
        };
    }, [scrollContainerRef, isHovered, showModal]);

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

    return (
        <OuterElement
            gesture={Gesture.Simultaneous(
                videoGesture,
                longPressGesture,
                sliderGesture
            )}
        >
            <View collapsable={false} style={styles.pressableContainer}>
                <Pressable
                    onPressIn={() => setIsHovered(true)}
                    onPressOut={() => setIsHovered(false)}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <View
                        ref={containerRef}
                        style={[
                            styles.messageContainer,
                            isHovered && styles.hovered,
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
                                <ContentEditor
                                    value={editedContent}
                                    onChange={setEditedContent}
                                    onSubmit={handleSaveEdit}
                                    onCancel={handleCancelEdit}
                                    submitButtonText="Save"
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
                                        style={styles.attachmentsWhileEditing}
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
                                        onMouseEnterModal={() =>
                                            setModalHovered(true)
                                        }
                                        onMouseLeaveModal={() => {
                                            setModalHovered(false);
                                            setOptionsModalVisible(false);
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

                        <MessageMoreOptionsMenu
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
                    </View>
                </Pressable>
            </View>
        </OuterElement>
    );
};

function createStyles(theme: Theme) {
    return StyleSheet.create({
        messageContainer: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            padding: 15,
            width: '100%',
            position: 'relative',
            overflow: 'visible',
        },
        pressableContainer: {
            flex: 1,
        },
        hovered: {
            backgroundColor: theme.colors.TertiaryBackground,
        },
        avatar: {
            width: 40,
            height: 40,
            borderRadius: 20,
            marginRight: 10,
        },
        innerContainer: {
            flex: 1,
            flexShrink: 1,
        },
        userName: {
            fontSize: 14,
            fontWeight: 'bold',
            color: theme.colors.ActiveText,
            fontFamily: 'Roboto_700Bold',
        },
        time: {
            fontSize: 12,
            color: theme.colors.InactiveText,
            fontFamily: 'Roboto_400Regular',
        },
        viewContainer: {
            // Container for normal viewing mode
        },
        editContainer: {
            // Container for edit mode components
        },
        linkPreviewsWhileEditing: {
            marginTop: 10,
        },
        attachmentsWhileEditing: {
            marginTop: 10,
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
