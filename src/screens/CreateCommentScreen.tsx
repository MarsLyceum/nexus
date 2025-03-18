import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Platform,
    SafeAreaView,
    LayoutChangeEvent,
} from 'react-native';
import { NavigationProp } from '@react-navigation/core';
import { COLORS } from '../constants';
import { AttachmentImageGallery, ImageDetailsModal } from '../sections';
import {
    LinkPreview,
    MarkdownRenderer,
    CommentEditor,
} from '../small-components';
import { getRelativeTime, extractUrls, stripHtml } from '../utils';
import { CurrentCommentContext } from '../providers';

type RootStackParamList = {
    CreateComment: Record<string, unknown>;
};

type CreateCommentScreenProps = {
    navigation: NavigationProp<RootStackParamList, 'CreateComment'>;
};

export const CreateCommentScreen: React.FC<CreateCommentScreenProps> = ({
    navigation,
}) => {
    // Removed local state for editor since we're now using CommentEditor.
    const {
        parentUser,
        parentContent,
        parentDate,
        parentCommentId,
        postId,
        parentAttachmentUrls,
    } = useContext(CurrentCommentContext);

    // Compute parent content details for link preview logic
    const urlsInParentContent = extractUrls(parentContent);
    const plainParentContent = stripHtml(parentContent);
    const isParentContentJustLink =
        urlsInParentContent.length === 1 &&
        plainParentContent === urlsInParentContent[0];

    // State to track parent's content container width for LinkPreview
    const [parentContainerWidth, setParentContainerWidth] = useState(0);
    const handleParentLayout = (event: LayoutChangeEvent) => {
        const { width } = event.nativeEvent.layout;
        setParentContainerWidth(width);
    };

    // State for parent's attachment modal
    const [modalVisible, setModalVisible] = useState(false);
    const [modalStartIndex, setModalStartIndex] = useState(0);

    // Handler for parent's attachment image press
    const handleParentImagePress = (index: number) => {
        setModalStartIndex(index);
        setModalVisible(true);
    };

    return (
        // @ts-expect-error style
        <SafeAreaView style={styles.safeContainer}>
            {/* @ts-expect-error style */}
            <ScrollView
                style={styles.scrollSection}
                contentContainerStyle={styles.scrollContainerStyle}
            >
                {/* @ts-expect-error style */}
                <View style={styles.modalContainer}>
                    {/* @ts-expect-error style */}
                    <Text style={styles.userInfo}>
                        {parentUser} • {getRelativeTime(parentDate)}
                    </Text>
                    <View
                        // @ts-expect-error style
                        style={styles.parentContentContainer}
                        onLayout={handleParentLayout}
                    >
                        <>
                            {!isParentContentJustLink && (
                                <MarkdownRenderer
                                    text={parentContent}
                                    preview
                                />
                            )}
                            {urlsInParentContent.map((url, index) => (
                                <LinkPreview
                                    key={index}
                                    url={url}
                                    containerWidth={parentContainerWidth}
                                />
                            ))}
                            {parentAttachmentUrls &&
                                parentAttachmentUrls.length > 0 && (
                                    <View
                                        style={{
                                            alignSelf: 'flex-start',
                                            marginBottom: 15,
                                        }}
                                    >
                                        <AttachmentImageGallery
                                            attachmentUrls={
                                                parentAttachmentUrls
                                            }
                                            onImagePress={
                                                handleParentImagePress
                                            }
                                            containerWidth={
                                                parentContainerWidth
                                            }
                                        />
                                    </View>
                                )}
                        </>
                    </View>
                    {/*
                      Replaced direct comment editor logic with the CommentEditor component.
                      The CommentEditor handles all aspects of the comment creation,
                      including toggling editors, attachments, and action buttons.
                    */}
                    <CommentEditor
                        postId={postId}
                        parentCommentId={parentCommentId}
                        onCancel={() => navigation.goBack()}
                        onCommentCreated={() => navigation.goBack()}
                        expandedByDefault
                        editorBackgroundColor={COLORS.PrimaryBackground}
                    />
                </View>
                {parentAttachmentUrls && parentAttachmentUrls.length > 0 && (
                    <ImageDetailsModal
                        visible={modalVisible}
                        attachments={parentAttachmentUrls}
                        initialIndex={modalStartIndex}
                        onClose={() => setModalVisible(false)}
                    />
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
    scrollSection: isWeb
        ? {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflowY: 'auto',
              backgroundColor: COLORS.AppBackground,
          }
        : { flex: 1, backgroundColor: COLORS.AppBackground },
    // @ts-expect-error web only types
    safeContainer: {
        flex: 1,
        backgroundColor: COLORS.SecondaryBackground,
        paddingTop: 15,
        ...(isWeb && { height: '100vh', display: 'flex' }),
    },
    scrollContainer: {
        flex: 1,
        backgroundColor: COLORS.AppBackground,
    },
    scrollContainerStyle: {
        flexGrow: 1,
    },
    modalContainer: {
        backgroundColor: COLORS.AppBackground,
        borderRadius: 8,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
        color: COLORS.White,
    },
    userInfo: {
        fontSize: 14,
        color: COLORS.InactiveText,
        marginBottom: 10,
    },
    parentContentContainer: {
        borderWidth: 1,
        borderColor: COLORS.InactiveText,
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
        backgroundColor: COLORS.SecondaryBackground,
    },
    toggleButton: {
        alignSelf: 'flex-end',
        marginBottom: 10,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: COLORS.SecondaryBackground,
        borderRadius: 5,
    },
    modalButtonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    modalButton: {
        marginLeft: 10,
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
        backgroundColor: COLORS.Primary,
    },
    modalButtonText: {
        color: COLORS.White,
        fontWeight: '600',
    },
    editorContainer: {
        marginBottom: 15,
    },
    toggleButtonText: {
        color: COLORS.White,
        fontWeight: '600',
    },
});
