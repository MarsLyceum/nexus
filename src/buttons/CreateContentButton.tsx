// CreateContentButton.tsx
import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    TextInput,
    Pressable,
    StyleSheet,
    Platform,
    StyleProp,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { COLORS } from '../constants';

type CreateContentButtonProps = {
    /** Controls visibility of the modal */
    modalVisible: boolean;
    setModalVisible: (visible: boolean) => void;

    /** First text field (e.g. “Title”) */
    contentText: string;
    setContentText: (text: string) => void;

    /** Handler for when user presses “Create” */
    handleCreate: () => void;

    /** Text for the bottom button that opens the modal (e.g. “Write a comment...” or “+”) */
    buttonText: string;

    /**
     * Modal Title (overrides the big text at the top of the Modal).
     * If not provided, defaults to the same as `buttonText`.
     */
    modalTitle?: string;

    /**
     * (Optional) Show a second text field. E.g. for “Content” in a post.
     * If `true`, it will render a second TextInput.
     */
    showSecondField?: boolean;

    /** State and setter for second text field. Only used if `showSecondField` is true. */
    secondContentText?: string;
    setSecondContentText?: (text: string) => void;

    /**
     * Placeholders for the TextInputs
     */
    placeholderText?: string; // placeholder for the first field
    placeholderText2?: string; // placeholder for the second field

    /** If the second text field should allow multiline. */
    multilineSecondField?: boolean;

    /** Optional style overrides for the entire modal container. */
    modalContainerStyle?: StyleProp<ViewStyle>;
    /** Optional style overrides for the modal title text. */
    modalTitleStyle?: StyleProp<TextStyle>;
};

const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
    bottomSection: isWeb
        ? {
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 60,
              borderTopWidth: 1,
              borderTopColor: '#4A3A5A',
              backgroundColor: COLORS.SecondaryBackground,
              justifyContent: 'center',
              paddingHorizontal: 10,
              zIndex: 10,
          }
        : {
              height: 60,
              borderTopWidth: 1,
              borderTopColor: '#4A3A5A',
              backgroundColor: COLORS.SecondaryBackground,
              justifyContent: 'center',
              paddingHorizontal: 10,
          },
    input: {
        backgroundColor: COLORS.TextInput,
        color: 'white',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '85%',
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
    textInput: {
        borderWidth: 1,
        borderColor: COLORS.InactiveText,
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
        color: COLORS.White,
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
});

/**
 * A reusable button at the bottom of the screen that opens a configurable modal
 * (optionally with two TextInputs) to create new content, post, comment, etc.
 */
export const CreateContentButton: React.FC<CreateContentButtonProps> = ({
    modalVisible,
    setModalVisible,
    contentText,
    setContentText,
    handleCreate,
    buttonText,
    modalTitle,
    showSecondField = false,
    secondContentText,
    setSecondContentText,
    placeholderText = 'Write here...',
    placeholderText2 = 'More text...',
    multilineSecondField = false,
    modalContainerStyle,
    modalTitleStyle,
}) => (
    <>
        {/* Bottom Fixed Button */}
        <View style={styles.bottomSection}>
            <TouchableOpacity
                style={styles.input}
                onPress={() => setModalVisible(true)}
            >
                <Text style={{ color: COLORS.InactiveText }}>{buttonText}</Text>
            </TouchableOpacity>
        </View>

        {/* Modal for Creating Content */}
        <Modal
            visible={modalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContainer, modalContainerStyle]}>
                    {/* Title */}
                    <Text style={[styles.modalTitle, modalTitleStyle]}>
                        {modalTitle || buttonText}
                    </Text>

                    {/* First field */}
                    <TextInput
                        placeholder={placeholderText}
                        placeholderTextColor={COLORS.InactiveText}
                        style={styles.textInput}
                        value={contentText}
                        onChangeText={setContentText}
                    />

                    {/* Optional second field */}
                    {showSecondField && setSecondContentText && (
                        <TextInput
                            placeholder={placeholderText2}
                            placeholderTextColor={COLORS.InactiveText}
                            style={[
                                styles.textInput,
                                multilineSecondField && { height: 80 },
                            ]}
                            value={secondContentText}
                            onChangeText={setSecondContentText}
                            multiline={multilineSecondField}
                        />
                    )}

                    {/* Action Buttons */}
                    <View style={styles.modalButtonRow}>
                        <Pressable
                            style={styles.modalButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.modalButtonText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            style={styles.modalButton}
                            onPress={handleCreate}
                        >
                            <Text style={styles.modalButtonText}>Create</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    </>
);
