import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import Icon from 'react-native-vector-icons/FontAwesome5';
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

import { Attachment } from '../types';
import { NexusVideo } from '../small-components';
import { COLORS } from '../constants';

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
    if (attachments.length > 0) {
        // WEB IMPLEMENTATION USING dnd-kit
        if (Platform.OS === 'web') {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const sensors = useSensors(
                // eslint-disable-next-line react-hooks/rules-of-hooks
                useSensor(PointerSensor, {
                    activationConstraint: { distance: 5 },
                })
            );

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
                            <ExpoImage
                                source={{ uri: item.previewUri }}
                                style={styles.attachmentImage}
                            />
                        )}
                        {onRemoveAttachment && (
                            <TouchableOpacity
                                style={styles.removeAttachmentButton}
                                onPress={() => onRemoveAttachment(item.id)}
                            >
                                <Icon
                                    name="times"
                                    size={18}
                                    color={COLORS.White}
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
}

const SortableItem: React.FC<SortableItemProps> = ({
    id,
    attachment,
    onAttachmentPress,
    onRemoveAttachment,
}) => {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id });
    // Removed the inline marginRight here so the item uses the margin defined in styles.draggableItem
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: 'grab',
    };
    const isVideo = attachment.file?.type?.startsWith('video');
    return (
        // @ts-expect-error web only styles
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
                    <ExpoImage
                        source={{ uri: attachment.previewUri }}
                        style={styles.attachmentImage}
                    />
                )}
                {onRemoveAttachment && (
                    <TouchableOpacity
                        style={styles.removeAttachmentButton}
                        onPress={() => onRemoveAttachment(attachment.id)}
                    >
                        <Icon name="times" size={18} color={COLORS.White} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
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
        backgroundColor: COLORS.AppBackground,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
