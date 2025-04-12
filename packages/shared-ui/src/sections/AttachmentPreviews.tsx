import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
// Mobile drag and drop library
import DraggableFlatList from 'react-native-draggable-flatlist';
// For web: using dnd-kit
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    horizontalListSortingStrategy,
    arrayMove,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Cancel } from '../icons';
import { Attachment } from '../types';
import { NexusVideo, NexusImage } from '../small-components';
import { useTheme, Theme } from '../theme';

type AttachmentPreviewsProps = {
    attachments: Attachment[];
    onAttachmentPress?: (attachment: Attachment) => void;
    onRemoveAttachment?: (attachmentId: string) => void;
    onAttachmentsReorder?: (newOrder: Attachment[]) => void;
};

export const AttachmentPreviews: React.FC<AttachmentPreviewsProps> = ({
    attachments,
    onAttachmentPress,
    onRemoveAttachment,
    onAttachmentsReorder,
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const pointerSensor = useSensor(PointerSensor, {
        activationConstraint: { distance: 5 },
    });
    const sensors = useSensors(pointerSensor);

    if (attachments.length > 0) {
        // WEB IMPLEMENTATION USING dnd-kit
        if (Platform.OS === 'web') {
            const handleDragEnd = (event: DragEndEvent) => {
                const { active, over } = event;
                if (over && active.id !== over.id) {
                    const oldIndex = attachments.findIndex(
                        (item) => item.id === active.id
                    );
                    const newIndex = attachments.findIndex(
                        (item) => item.id === over.id
                    );
                    const newOrder = arrayMove(attachments, oldIndex, newIndex);
                    if (onAttachmentsReorder) onAttachmentsReorder(newOrder);
                }
            };

            return (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={attachments.map((item) => item.id)}
                        strategy={horizontalListSortingStrategy}
                    >
                        <View
                            style={[
                                styles.attachmentsContainer,
                                styles.attachmentsPreviewContainer,
                            ]}
                        >
                            {attachments.map((item) => (
                                <SortableItem
                                    key={item.id}
                                    id={item.id}
                                    attachment={item}
                                    onAttachmentPress={onAttachmentPress}
                                    onRemoveAttachment={onRemoveAttachment}
                                    styles={styles}
                                />
                            ))}
                        </View>
                    </SortableContext>
                </DndContext>
            );
        }

        // MOBILE IMPLEMENTATION USING react-native-draggable-flatlist
        const renderItem = ({
            item,
            drag,
        }: {
            item: Attachment;
            drag: () => void;
        }) => {
            const isVideo = item.file?.type?.startsWith('video');
            return (
                <TouchableOpacity
                    onLongPress={drag}
                    onPress={() => onAttachmentPress && onAttachmentPress(item)}
                    style={styles.draggableItem}
                    delayLongPress={200}
                >
                    <View style={styles.attachmentPreview}>
                        {isVideo ? (
                            <NexusVideo
                                source={{ uri: item.previewUri }}
                                style={styles.attachmentImage}
                                muted
                                repeat
                                contentFit="cover"
                                paused
                                controls={false}
                            />
                        ) : (
                            <NexusImage
                                source={item.previewUri}
                                style={styles.attachmentImage}
                                alt="Attachment preview"
                                width={80}
                                height={80}
                                contentFit="cover"
                            />
                        )}
                        {onRemoveAttachment && (
                            <TouchableOpacity
                                style={styles.removeAttachmentButton}
                                onPress={() => onRemoveAttachment(item.id)}
                            >
                                <Cancel
                                    size={15}
                                    color={theme.colors.ActiveText}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                </TouchableOpacity>
            );
        };

        return (
            <View style={styles.attachmentsContainer}>
                <DraggableFlatList
                    horizontal
                    data={attachments}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    onDragEnd={({ data }) =>
                        onAttachmentsReorder && onAttachmentsReorder(data)
                    }
                    contentContainerStyle={styles.attachmentsPreviewContainer}
                />
            </View>
        );
    }
    return undefined;
};

interface SortableItemProps {
    id: string;
    attachment: Attachment;
    onAttachmentPress?: (attachment: Attachment) => void;
    onRemoveAttachment?: (attachmentId: string) => void;
    styles: ReturnType<typeof createStyles>;
}

const SortableItem: React.FC<SortableItemProps> = ({
    id,
    attachment,
    onAttachmentPress,
    onRemoveAttachment,
    styles,
}) => {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id });
    const { theme } = useTheme();

    // Removed the inline marginRight here so the item uses the margin defined in styles.draggableItem
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: 'grab',
    };
    const isVideo = attachment.file?.type?.startsWith('video');
    return (
        // @ts-expect-error ref
        <View
            ref={setNodeRef}
            style={[styles.draggableItem, style]}
            {...attributes}
            {...listeners}
            onClick={() => onAttachmentPress && onAttachmentPress(attachment)}
        >
            <View style={styles.attachmentPreview}>
                {isVideo ? (
                    <NexusVideo
                        source={{ uri: attachment.previewUri }}
                        style={styles.attachmentImage}
                        muted
                        repeat
                        contentFit="cover"
                        paused
                        controls={false}
                    />
                ) : (
                    <NexusImage
                        source={attachment.previewUri}
                        style={styles.attachmentImage}
                        alt="Attachment preview"
                        width={80}
                        height={80}
                        contentFit="cover"
                    />
                )}
                {onRemoveAttachment && (
                    <TouchableOpacity
                        style={styles.removeAttachmentButton}
                        onPress={() => onRemoveAttachment(attachment.id)}
                    >
                        <Cancel size={15} color={theme.colors.ActiveText} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

function createStyles(theme: Theme) {
    return StyleSheet.create({
        attachmentsContainer: {
            paddingVertical: 10,
        },
        attachmentsPreviewContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
        },
        draggableItem: {
            // Added marginRight for consistent spacing across platforms.
            marginRight: 10,
        },
        attachmentPreview: {
            position: 'relative',
        },
        attachmentImage: {
            width: 80,
            height: 80,
            borderRadius: 10,
        },
        removeAttachmentButton: {
            position: 'absolute',
            top: 4,
            right: 4,
            backgroundColor: theme.colors.AppBackground,
            width: 24,
            height: 24,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
        },
    });
}
