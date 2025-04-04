import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NexusImage } from './NexusImage';
import { COLORS } from '../constants';
import { MessageContent, MessageEditor } from './message';
import { MessageOptionsModal } from './MessageOptionsModal';
import { formatDateForChat } from '../utils';
import type { MessageWithAvatar, DirectMessageWithAvatar } from '../types';

export type MessageItemProps = {
    message: MessageWithAvatar | DirectMessageWithAvatar;
    width: number;
    onAttachmentPress: (attachments: string[], index: number) => void;
    scrollContainerRef: React.RefObject<any>;
};

const getMessageDate = (
    message: MessageWithAvatar | DirectMessageWithAvatar
): Date => message.postedAt ?? new Date(message.createdAt);

export const MessageItem: React.FC<MessageItemProps> = ({
    message,
    width,
    onAttachmentPress,
    scrollContainerRef,
}) => {
    const [optionsModalVisible, setOptionsModalVisible] = useState(false);
    const [anchorPosition, setAnchorPosition] = useState<{
        x: number;
        y: number;
        width: number;
        height: number;
    } | null>(null);
    const [modalHovered, setModalHovered] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(message.content ?? '');
    const containerRef = useRef<View>(null);
    const messageDate = getMessageDate(message);

    // Measure the container and set the anchor based on its top-right edge.
    const showModal = () => {
        if (containerRef.current) {
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
        setIsHovered(true);
        if (!isScrolling) showModal();
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        if (!modalHovered) setOptionsModalVisible(false);
    };

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
        document.addEventListener('mousemove', handleDocumentMouseMove, {
            passive: true,
        });
        return () => {
            document.removeEventListener('mousemove', handleDocumentMouseMove);
        };
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
        return () => {
            scrollContainer.removeEventListener('scroll', handleScroll);
        };
    }, [scrollContainerRef]);

    const handleEdit = () => {
        setOptionsModalVisible(false);
        setIsEditing(true);
    };

    const handleMore = () => {
        console.log('More action triggered for message:', message);
    };

    const handleSaveEdit = () => {
        console.log('Saving edited message:', editedContent);
        message.content = editedContent;
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditedContent(message.content ?? '');
        setIsEditing(false);
    };

    // Check if we have attachments
    const hasAttachments =
        message.attachmentUrls && message.attachmentUrls.length > 0;

    return (
        <View
            ref={containerRef}
            style={[styles.messageContainer, isHovered && styles.hovered]}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <NexusImage
                source={message.avatar}
                style={styles.avatar}
                width={40}
                height={40}
                alt="User avatar"
            />
            <View style={styles.innerContainer}>
                <Text style={styles.userName}>
                    {message.username}{' '}
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
                        message={message}
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
                        message={message}
                        onAttachmentPress={onAttachmentPress}
                    />

                    {/* Link previews with live updates */}
                    <View style={styles.linkPreviewsWhileEditing}>
                        <MessageContent
                            message={message}
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
                                message={message}
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
            {!isEditing && optionsModalVisible && anchorPosition && (
                <View style={styles.optionsModalContainer}>
                    <MessageOptionsModal
                        visible={optionsModalVisible}
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
        </View>
    );
};

const styles = StyleSheet.create({
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 15,
        width: '100%',
        position: 'relative',
        overflow: 'visible',
    },
    hovered: {
        backgroundColor: COLORS.TertiaryBackground,
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
        color: COLORS.White,
        fontFamily: 'Roboto_700Bold',
    },
    time: {
        fontSize: 12,
        color: COLORS.InactiveText,
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
