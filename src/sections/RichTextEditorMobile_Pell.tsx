// RichTextEditorMobile.tsx
import React, { useRef, useState } from 'react';
import {
    View,
    StyleSheet,
    Text,
    Modal,
    TextInput,
    TouchableOpacity,
} from 'react-native';
import { COLORS } from '../constants';
import {
    RichEditor as PellRichEditor,
    RichToolbar as PellRichToolbar,
} from 'react-native-pell-rich-editor';

interface RichTextEditorMobileProps {
    initialContent?: string;
    onChange: (html: string) => void;
}

export const RichTextEditorMobile: React.FC<RichTextEditorMobileProps> = ({
    initialContent = '',
    onChange,
}) => {
    const richTextRef = useRef<PellRichEditor>(null);
    const [value, setValue] = useState(initialContent);
    const [linkModalVisible, setLinkModalVisible] = useState(false);
    const [tempLink, setTempLink] = useState('');

    const handleMobileChange = (htmlString: string) => {
        setValue(htmlString);
        onChange(htmlString);
    };

    const onPressAddLink = () => {
        setLinkModalVisible(true);
    };

    const insertLink = () => {
        if (tempLink.trim()) {
            richTextRef.current?.insertLink(tempLink, tempLink);
        }
        setLinkModalVisible(false);
        setTempLink('');
    };

    return (
        <View style={styles.mobileContainer}>
            <PellRichEditor
                ref={richTextRef}
                initialContentHTML={value}
                style={styles.mobileEditor}
                onChange={handleMobileChange}
                editorStyle={{
                    backgroundColor: COLORS.PrimaryBackground,
                    color: COLORS.MainText,
                    placeholderColor: COLORS.InactiveText,
                }}
                // Pass originWhitelist correctly as an array
                originWhitelist={['*']}
                webviewProps={{ originWhitelist: ['*'] }}
            />

            <PellRichToolbar
                editor={richTextRef}
                actions={[
                    'bold',
                    'italic',
                    'underline',
                    'heading1',
                    'heading2',
                    'link',
                ]}
                iconTint={COLORS.MainText}
                selectedIconTint={COLORS.Primary}
                style={styles.toolbar}
                onPressAddLink={onPressAddLink}
            />

            <Modal
                visible={linkModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setLinkModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Insert Link</Text>
                        <TextInput
                            style={styles.linkInput}
                            placeholder="Enter URL"
                            placeholderTextColor={COLORS.InactiveText}
                            value={tempLink}
                            onChangeText={setTempLink}
                            autoCapitalize="none"
                            keyboardType="url"
                        />
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    { backgroundColor: COLORS.Primary },
                                ]}
                                onPress={() => setLinkModalVisible(false)}
                            >
                                <Text style={{ color: COLORS.White }}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    { backgroundColor: COLORS.Primary },
                                ]}
                                onPress={insertLink}
                            >
                                <Text style={{ color: COLORS.White }}>
                                    Insert
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    mobileContainer: {
        flex: 1,
        padding: 10,
    },
    mobileEditor: {
        flex: 1,
        minHeight: 200,
        borderWidth: 1,
        borderColor: COLORS.InactiveText,
    },
    toolbar: {
        borderTopWidth: 1,
        borderColor: COLORS.InactiveText,
        backgroundColor: COLORS.TextInput,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '80%',
        backgroundColor: COLORS.AppBackground,
        borderRadius: 8,
        padding: 20,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.White,
        marginBottom: 10,
    },
    linkInput: {
        borderWidth: 1,
        borderColor: COLORS.InactiveText,
        borderRadius: 5,
        padding: 8,
        color: COLORS.White,
        marginBottom: 15,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    button: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 5,
        marginLeft: 10,
    },
});
