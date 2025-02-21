import React from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { COLORS } from '../constants';

export interface Attachment {
    id: string;
    previewUri: string;
    file: File | { uri: string; type: string; name: string };
}

interface AttachmentPreviewsProps {
    attachments: Attachment[];
    onAttachmentPress?: (attachment: Attachment) => void;
    onRemoveAttachment?: (attachmentId: string) => void;
}

export const AttachmentPreviews: React.FC<AttachmentPreviewsProps> = ({
    attachments,
    onAttachmentPress,
    onRemoveAttachment,
}) => {
    // eslint-disable-next-line unicorn/no-useless-undefined
    if (attachments.length === 0) return undefined;
    return (
        <View style={styles.attachmentsContainer}>
            <ScrollView
                horizontal
                contentContainerStyle={styles.attachmentsPreviewContainer}
                showsHorizontalScrollIndicator={false}
            >
                {attachments.map((att) => (
                    <View key={att.id} style={styles.attachmentPreview}>
                        <TouchableOpacity
                            onPress={() =>
                                onAttachmentPress && onAttachmentPress(att)
                            }
                        >
                            <ExpoImage
                                source={{ uri: att.previewUri }}
                                style={styles.attachmentImage}
                            />
                        </TouchableOpacity>
                        {onRemoveAttachment && (
                            <TouchableOpacity
                                style={styles.removeAttachmentButton}
                                onPress={() => onRemoveAttachment(att.id)}
                            >
                                <Icon
                                    name="times"
                                    size={18}
                                    color={COLORS.White}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                ))}
            </ScrollView>
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
    attachmentPreview: {
        position: 'relative',
        marginRight: 10,
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
