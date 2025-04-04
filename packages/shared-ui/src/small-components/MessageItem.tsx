import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { NexusImage } from './NexusImage';
import { COLORS } from '../constants';
import { MessageContent, MessageEditor } from './message';
import { MessageOptionsModal } from './MessageOptionsModal';
import { formatDateForChat } from '../utils';
import type { MessageWithAvatar, DirectMessageWithAvatar } from '../types';

export type MessageItemProps = {
    item: MessageWithAvatar | DirectMessageWithAvatar;
    width: number;
    onAttachmentPress: (attachments: string[], index: number) => void;
    scrollContainerRef: React.RefObject<any>;
};

const getMessageDate = (
    item: MessageWithAvatar | DirectMessageWithAvatar
): Date => item.postedAt ?? new Date(item.createdAt);

export const MessageItem: React.FC<MessageItemProps> = ({
    item,
    width,
    onAttachmentPress,
    scrollContainerRef,
}) => {
    const [optionsModalVisible, setOptionsModalVisible] = useState(false);
    // New state to hold the measured anchor position
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
    const [editedContent, setEditedContent] = useState(item.content ?? '');
    const containerRef = useRef<View>(null);
    const messageDate = getMessageDate(item);

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
        console.log('More action triggered for message:', item);
    };

    const handleSaveEdit = () => {
        console.log('Saving edited message:', editedContent);
        item.content = editedContent;
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditedContent(item.content ?? '');
        setIsEditing(false);
    };

    return (
        <View
            ref={containerRef}
            style={[styles.messageContainer, isHovered && styles.hovered]}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <NexusImage
                source={item.avatar}
                style={styles.avatar}
                width={40}
                height={40}
                alt="User avatar"
            />
            <View style={styles.innerContainer}>
                <Text style={styles.userName}>
                    {item.username}{' '}
                    <Text style={styles.time}>
                        {formatDateForChat(messageDate)}
                    </Text>
                </Text>
                {isEditing ? (
                    <MessageEditor
                        initialContent={editedContent}
                        width={width}
                        onChange={setEditedContent}
                        onSave={handleSaveEdit}
                        onCancel={handleCancelEdit}
                    />
                ) : (
                    <MessageContent
                        item={item}
                        width={width}
                        onAttachmentPress={onAttachmentPress}
                    />
                )}
            </View>
            {/* Render the options modal and pass the measured anchorPosition and opt-in flag */}
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
        position: 'relative', // Ensures that absolute children are positioned relative to this container
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
    optionsModalContainer: {
        position: 'absolute',
        // No fixed top/right here – the MiniModal will use the anchorPosition we passed.
        zIndex: 100,
    },
});
