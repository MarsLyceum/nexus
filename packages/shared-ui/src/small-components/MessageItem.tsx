import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image as RNImage,
    findNodeHandle,
    Dimensions, // Added Dimensions for screen bounds
} from 'react-native';
import { NexusImage } from './NexusImage';
import { LinkPreview } from './LinkPreview';
import {
    MessageWithAvatar,
    DirectMessageWithAvatar,
    PreviewData,
} from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { extractUrls, formatDateForChat, isImageExtensionUrl } from '../utils';
import { useMediaTypes } from '../hooks/useMediaTypes';
import { NexusVideo } from '.';
import { MessageOptionsModal } from './MessageOptionsModal';
import { COLORS } from '../constants';

export type MessageItemProps = {
    item: MessageWithAvatar | DirectMessageWithAvatar;
    width: number;
    onAttachmentPress: (attachments: string[], index: number) => void;
    scrollContainerRef: React.RefObject<any>;
};

const getMessageDate = (
    item: MessageWithAvatar | DirectMessageWithAvatar
): Date => {
    return item.postedAt ? item.postedAt : new Date(item.createdAt);
};

const NativeSizeAttachmentImage: React.FC<{ uri: string }> = ({ uri }) => {
    const [dimensions, setDimensions] = useState<{
        width: number;
        height: number;
    }>();
    useEffect(() => {
        RNImage.getSize(
            uri,
            (width, height) => setDimensions({ width, height }),
            (error) =>
                console.error(
                    'Failed to get image dimensions for image in message',
                    uri,
                    error
                )
        );
    }, [uri]);

    if (!dimensions) return null;
    const scaledWidth = dimensions.width * 0.5;
    const scaledHeight = dimensions.height * 0.5;

    return (
        <NexusImage
            source={uri}
            style={{
                ...styles.messageAttachmentImage,
                width: scaledWidth,
                height: scaledHeight,
            }}
            contentFit="contain"
            width={scaledWidth}
            height={scaledHeight}
            alt="Message attachment image"
        />
    );
};

const NativeSizeAttachmentVideo: React.FC<{
    uri: string;
    nativeWidth: number;
    nativeHeight: number;
    aspectRatio: number;
}> = ({ uri, nativeWidth, nativeHeight }) => {
    const scaledWidth = nativeWidth * 0.5;
    const scaledHeight = nativeHeight * 0.5;
    return (
        <NexusVideo
            source={{ uri }}
            style={[
                styles.messageAttachmentImage,
                { width: scaledWidth, height: scaledHeight },
            ]}
            muted={false}
            repeat
            paused
            contentFit="contain"
        />
    );
};

const renderMessageContent = (
    content: string,
    width: number,
    previewData?: PreviewData[]
) => {
    const trimmedContent = content.trim();
    const urls = extractUrls(trimmedContent);

    if (previewData && previewData.length > 0) {
        if (
            previewData.length === 1 &&
            trimmedContent === previewData[0].url &&
            isImageExtensionUrl(previewData[0].url)
        ) {
            return (
                <LinkPreview
                    previewData={previewData[0]}
                    containerWidth={width - 32}
                />
            );
        }
        return (
            <>
                <MarkdownRenderer text={content} />
                {previewData.map((pd, index) => (
                    <LinkPreview
                        key={index}
                        previewData={pd}
                        containerWidth={width - 32}
                    />
                ))}
            </>
        );
    }

    if (
        urls.length === 1 &&
        trimmedContent === urls[0] &&
        isImageExtensionUrl(urls[0])
    ) {
        return <LinkPreview url={urls[0]} containerWidth={width - 32} />;
    }

    if (urls.length > 0) {
        return (
            <>
                <MarkdownRenderer text={content} />
                {urls.map((url, index) => (
                    <LinkPreview
                        key={index}
                        url={url}
                        containerWidth={width - 32}
                    />
                ))}
            </>
        );
    }

    return <MarkdownRenderer text={content} />;
};

const MessageItemComponent: React.FC<MessageItemProps> = ({
    item,
    width,
    onAttachmentPress,
    scrollContainerRef,
}) => {
    const mediaInfos = useMediaTypes(item.attachmentUrls || []);
    const messageDate = getMessageDate(item);

    const [optionsModalVisible, setOptionsModalVisible] = useState(false);
    const [modalHovered, setModalHovered] = useState(false);
    const [anchorPosition, setAnchorPosition] = useState<{
        x: number;
        y: number;
        width: number;
        height: number;
    } | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);

    const containerRef = useRef<View>(null);
    const lastMousePositionRef = useRef<{ x: number; y: number }>({
        x: 0,
        y: 0,
    });
    const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Updated showModal: clamp the anchorPosition to visible screen area.
    const showModal = () => {
        if (containerRef.current) {
            containerRef.current.measureInWindow(
                (x, y, containerWidth, containerHeight) => {
                    const { width: screenWidth, height: screenHeight } =
                        Dimensions.get('window');
                    const margin = 10;
                    // Compute the effective anchor: top-right of the message,
                    // but clamped so it doesn't exceed the screen bounds.
                    const effectiveX = Math.min(
                        x + containerWidth - margin,
                        screenWidth - margin
                    );
                    const effectiveY = y < margin ? margin : y;
                    setAnchorPosition({
                        x: effectiveX,
                        y: effectiveY,
                        width: 0,
                        height: 0,
                    });
                    setOptionsModalVisible(true);
                }
            );
        }
    };

    const handleMouseEnter = () => {
        setIsHovered(true);
        if (!isScrolling) {
            showModal();
        }
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        if (!modalHovered) {
            setOptionsModalVisible(false);
        }
    };

    useEffect(() => {
        const handleDocumentMouseMove = (e: MouseEvent) => {
            lastMousePositionRef.current = { x: e.clientX, y: e.clientY };
            if (containerRef.current) {
                const messageRect = (
                    containerRef.current as unknown as Element
                ).getBoundingClientRect();
                const { clientX, clientY } = e;
                const isOverMessage =
                    clientX >= messageRect.left &&
                    clientX <= messageRect.right &&
                    clientY >= messageRect.top &&
                    clientY <= messageRect.bottom;
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
            : findNodeHandle(scrollContainerComponent);
        if (
            !scrollContainer ||
            typeof scrollContainer.addEventListener !== 'function'
        )
            return;

        const handleScroll = () => {
            setIsScrolling(true);
            setOptionsModalVisible(false);
            if (scrollTimerRef.current) {
                clearTimeout(scrollTimerRef.current);
            }
            scrollTimerRef.current = setTimeout(() => {
                setIsScrolling(false);
                if (containerRef.current) {
                    const rect = (
                        containerRef.current as unknown as Element
                    ).getBoundingClientRect();
                    const { x, y } = lastMousePositionRef.current;
                    const isOverMessage =
                        x >= rect.left &&
                        x <= rect.right &&
                        y >= rect.top &&
                        y <= rect.bottom;
                    if (isOverMessage) {
                        showModal();
                    }
                }
            }, 1000);
        };

        scrollContainer.addEventListener('scroll', handleScroll, {
            passive: true,
        });
        return () => {
            scrollContainer.removeEventListener('scroll', handleScroll);
            if (scrollTimerRef.current) {
                clearTimeout(scrollTimerRef.current);
            }
        };
    }, [scrollContainerRef]);

    const handleEdit = () => {
        console.log('Edit action triggered for message:', item);
    };

    const handleMore = () => {
        console.log('More action triggered for message:', item);
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
            <View style={styles.messageContent}>
                <Text style={styles.userName}>
                    {item.username}{' '}
                    <Text style={styles.time}>
                        {formatDateForChat(messageDate)}
                    </Text>
                </Text>
                {item.content
                    ? renderMessageContent(
                          item.content,
                          width,
                          item.previewData
                      )
                    : null}
                {item.attachmentUrls && item.attachmentUrls.length > 0 && (
                    <View style={styles.messageAttachmentsContainer}>
                        {item.attachmentUrls.map((url, index) => {
                            const info = mediaInfos[url];
                            return (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() =>
                                        onAttachmentPress(
                                            item.attachmentUrls ?? [],
                                            index
                                        )
                                    }
                                >
                                    {info && info.type === 'video' ? (
                                        <NativeSizeAttachmentVideo
                                            uri={url}
                                            nativeWidth={info.width}
                                            nativeHeight={info.height}
                                            aspectRatio={info.aspectRatio}
                                        />
                                    ) : info && info.type === 'image' ? (
                                        <NativeSizeAttachmentImage uri={url} />
                                    ) : null}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </View>

            {optionsModalVisible && anchorPosition && (
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
            )}
        </View>
    );
};

export const MessageItem = React.memo(MessageItemComponent);

const styles = StyleSheet.create({
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 15,
        width: '100%',
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
    messageContent: {
        flex: 1,
        flexShrink: 1,
    },
    userName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'white',
        fontFamily: 'Roboto_700Bold',
    },
    time: {
        fontSize: 12,
        color: 'gray',
        fontFamily: 'Roboto_400Regular',
    },
    messageText: {
        fontSize: 14,
        color: 'white',
        marginTop: 2,
        flexWrap: 'wrap',
        flexShrink: 1,
        fontFamily: 'Roboto_400Regular',
    },
    messageAttachmentsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 5,
    },
    messageAttachmentImage: {
        marginRight: 5,
        marginTop: 5,
        borderRadius: 8,
    },
});
