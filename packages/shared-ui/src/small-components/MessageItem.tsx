import React, {
    useState,
    useRef,
    useEffect,
    useCallback,
    useMemo,
} from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

import { useTheme, Theme } from '../theme';
import { MessageContent, MessageEditor } from './message';
import { formatDateForChat, isComputer } from '../utils';
import type { MessageWithAvatar, DirectMessageWithAvatar } from '../types';

import { MessageOptionsBottomSheet } from './MessageOptionsBottomSheet';
import { MessageOptionsModal } from './MessageOptionsModal';
import { MoreOptionsMenu } from './MoreOptionsMenu';
import { DeleteMessageConfirmationModal } from './DeleteMessageConfirmationModal';
import { NexusImage } from './NexusImage';

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
    const hideModalTimeoutRef = useRef<NodeJS.Timeout | undefined>();
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
    const showModal = () => {
        if (isComputer() && containerRef.current) {
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
    };

    const handleMouseEnter = () => {
        if (hideModalTimeoutRef.current) {
            clearTimeout(hideModalTimeoutRef.current);
            hideModalTimeoutRef.current = undefined;
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
        }, 300);
    };

    // eslint-disable-next-line consistent-return
    useEffect(() => {
        if (isComputer()) {
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
            document.addEventListener('mousemove', handleDocumentMouseMove, {
                passive: true,
            });
            return () => {
                document.removeEventListener(
                    'mousemove',
                    handleDocumentMouseMove
                );
            };
        }
    }, []);

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
        const handleScroll = () => {
            setIsScrolling(true);
            setOptionsModalVisible(false);
            setTimeout(() => {
                setIsScrolling(false);
            }, 1000);
        };
        scrollContainer.addEventListener('scroll', handleScroll, {
            passive: true,
        });
        // eslint-disable-next-line consistent-return
        return () => {
            scrollContainer.removeEventListener('scroll', handleScroll);
        };
    }, [scrollContainerRef]);

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

    return (
        <Pressable
            {...(isComputer() ? {} : { onLongPress: handleLongPress })}
            onPressIn={() => setIsHovered(true)}
            onPressOut={() => setIsHovered(false)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <View
                ref={containerRef}
                style={[styles.messageContainer, isHovered && styles.hovered]}
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
                            <View style={styles.attachmentsWhileEditing}>
                                <MessageContent
                                    message={currentMessage}
                                    width={width}
                                    onAttachmentPress={onAttachmentPress}
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
                                onClose={() => setOptionsModalVisible(false)}
                                anchorPosition={anchorPosition}
                                onEdit={handleEdit}
                                onMore={handleMore}
                                onMouseEnterModal={() => setModalHovered(true)}
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
                        onClose={() => setShowDeleteConfirmationModal(false)}
                        onConfirmDelete={handleDeleteMessageConfirm}
                        message={currentMessage}
                        onAttachmentPress={onAttachmentPress}
                    />
                )}
            </View>
        </Pressable>
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
