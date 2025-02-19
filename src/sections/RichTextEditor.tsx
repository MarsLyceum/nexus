import React, { useRef, useState, useEffect } from 'react';
import {
    Platform,
    View,
    StyleSheet,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
} from 'react-native';
import { COLORS } from '../constants';

// ======== Web: ReactQuill ========
let ReactQuill: any;
if (Platform.OS === 'web') {
    ReactQuill = require('react-quill');
    require('react-quill/dist/quill.snow.css'); // Load Quill default styles

    // Access Quill classes
    const Quill = ReactQuill.Quill;
    const Inline = Quill.import('blots/inline');

    // ======= Custom Spoiler Blot =======
    class SpoilerBlot extends Inline {
        static create() {
            const node = super.create();
            node.setAttribute('class', 'spoiler');
            // Insert a zero-width space so there's a caret position at the end of the spoiler
            node.appendChild(document.createTextNode('\u200B'));
            return node;
        }
        static formats(node: HTMLElement) {
            return node.getAttribute('class') === 'spoiler';
        }
        // Remove the zero-width space from the final text
        static value(node: HTMLElement) {
            return node.innerText.replace(/\u200B/g, '');
        }
    }
    SpoilerBlot.blotName = 'spoiler';
    SpoilerBlot.tagName = 'span';
    Quill.register(SpoilerBlot);

    // Add a custom spoiler icon
    const icons = Quill.import('ui/icons');
    icons['spoiler'] = `
      <svg viewBox="0 0 24 24">
        <title>Spoiler</title>
        <path d="M12,2L2,7v7c0,5,4,9,10,9s10-4,10-9V7L12,2z M12,17 c-3,0-5-2-5-5v-1l5-3l5,3v1C17,15,15,17,12,17z"/>
      </svg>
    `;

    // ======= Add Hover Titles for Default Icons (Bold, Italic, etc.) =======
    try {
        if (icons.bold) {
            icons.bold = icons.bold.replace('<svg', '<svg><title>Bold</title>');
        }
        if (icons.italic) {
            icons.italic = icons.italic.replace(
                '<svg',
                '<svg><title>Italic</title>'
            );
        }
        if (icons.underline) {
            icons.underline = icons.underline.replace(
                '<svg',
                '<svg><title>Underline</title>'
            );
        }
        if (icons.link) {
            icons.link = icons.link.replace('<svg', '<svg><title>Link</title>');
        }
        if (icons.clean) {
            icons.clean = icons.clean.replace(
                '<svg',
                '<svg><title>Remove Formatting</title>'
            );
        }
        // "ordered" and "bullet" are nested under icons.list
        if (icons.list?.ordered) {
            icons.list.ordered = icons.list.ordered.replace(
                '<svg',
                '<svg><title>Ordered List</title>'
            );
        }
        if (icons.list?.bullet) {
            icons.list.bullet = icons.list.bullet.replace(
                '<svg',
                '<svg><title>Bullet List</title>'
            );
        }
        // NEW: add a hover title for blockquote
        if (icons.blockquote) {
            icons.blockquote = icons.blockquote.replace(
                '<svg',
                '<svg><title>Blockquote</title>'
            );
        }
    } catch (e) {
        // If something doesn't exist, we ignore the error
        console.warn('Could not add hover titles to some icons:', e);
    }

    // Only define a handler for 'spoiler', let 'link' use Quill's default
    const toolbarHandlers = {
        spoiler: function () {
            const range = this.quill.getSelection();
            if (!range) return;
            if (range.length > 0) {
                // Toggle spoiler for selected text
                const currentFormat = this.quill.getFormat(range);
                const isActive = !!currentFormat.spoiler;
                this.quill.formatText(
                    range.index,
                    range.length,
                    'spoiler',
                    !isActive
                );

                // Insert a space node after the spoiler if needed
                setTimeout(() => {
                    const [leaf] = this.quill.getLeaf(range.index);
                    if (
                        leaf &&
                        leaf.parent &&
                        leaf.parent.statics?.blotName === 'spoiler'
                    ) {
                        const blot = leaf.parent;
                        if (!blot.domNode.nextSibling) {
                            const spaceNode = document.createTextNode(' ');
                            blot.domNode.parentNode?.insertBefore(
                                spaceNode,
                                blot.domNode.nextSibling
                            );
                        }
                    }
                }, 0);
            } else {
                // No text selected: Insert a 1-char spoiler placeholder
                const insertIndex = range.index;
                this.quill.insertText(insertIndex, '\u200B', { spoiler: true });
                // Move cursor to the right of it, so new typing is outside
                this.quill.setSelection(insertIndex + 1, 0);

                // Insert a space after it if no sibling
                setTimeout(() => {
                    const [leaf] = this.quill.getLeaf(insertIndex);
                    if (
                        leaf &&
                        leaf.parent &&
                        leaf.parent.statics?.blotName === 'spoiler'
                    ) {
                        const blot = leaf.parent;
                        if (!blot.domNode.nextSibling) {
                            const spaceNode = document.createTextNode(' ');
                            blot.domNode.parentNode?.insertBefore(
                                spaceNode,
                                blot.domNode.nextSibling
                            );
                        }
                    }
                }, 0);
            }
        },
        // 'link': false  <-- we omit this or set to false so Quill handles link natively
    };

    // Register Quill modules with only the spoiler handler
    (ReactQuill as any).modules = {
        toolbar: {
            container: [
                ['bold', 'italic', 'underline'],
                [{ header: [1, 2, 3, false] }],
                [{ list: 'ordered' }, { list: 'bullet' }],
                // ADDED 'blockquote' here:
                ['link', 'spoiler', 'blockquote'],
                ['clean'],
            ],
            handlers: toolbarHandlers, // No custom 'link' => default Quill link
        },
    };
}

// ======== Mobile: Pell Rich Editor ========
import { RichEditor, RichToolbar } from 'react-native-pell-rich-editor';

interface RichTextEditorProps {
    initialContent?: string;
    onChange: (html: string) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    initialContent = '',
    onChange,
}) => {
    const quillRef = useRef<any>(null);

    // Inject CSS for Quill on web
    useEffect(() => {
        if (Platform.OS === 'web') {
            const styleEl = document.createElement('style');
            styleEl.innerHTML = `
        /* 1) Toolbar icons: inactive=MainText, active/hover=Primary */
        .ql-toolbar button svg {
          stroke: ${COLORS.MainText} !important;
          fill: ${COLORS.MainText} !important;
        }
        .ql-stroke { stroke: ${COLORS.MainText} !important; }
        .ql-fill { fill: ${COLORS.MainText} !important; }
        .ql-toolbar button:hover svg,
        .ql-toolbar button.ql-active svg {
          stroke: ${COLORS.Primary} !important;
          fill: ${COLORS.Primary} !important;
        }
        .ql-toolbar button:hover .ql-stroke,
        .ql-toolbar button.ql-active .ql-stroke {
          stroke: ${COLORS.Primary} !important;
        }
        .ql-toolbar button:hover .ql-fill,
        .ql-toolbar button.ql-active .ql-fill {
          fill: ${COLORS.Primary} !important;
        }
        .ql-toolbar .ql-picker-label,
        .ql-toolbar .ql-picker-item {
          color: ${COLORS.MainText} !important;
        }
        .ql-toolbar .ql-picker-label:hover,
        .ql-toolbar .ql-picker-item:hover,
        .ql-toolbar .ql-picker-label.ql-active,
        .ql-toolbar .ql-picker-item.ql-selected {
          color: ${COLORS.Primary} !important;
        }

        /* 2) Editor container styling */
        .ql-container.ql-snow {
          border: 1px solid ${COLORS.TextInput} !important;
          border-radius: 5px !important;
          height: 200px !important;
          overflow: hidden;
        }
        .ql-editor {
          height: 100% !important;
          padding: 10px !important;
          box-sizing: border-box;
        }

        /* 3) Link tooltip styling */
        .ql-tooltip {
          background-color: ${COLORS.PrimaryBackground} !important;
          border: 1px solid ${COLORS.TextInput} !important;
          color: ${COLORS.MainText} !important;
          border-radius: 5px !important;
          top: 0 !important;
          left: 0 !important;
          transform: translate(10%, 10%) !important;
          z-index: 1000;
        }
        .ql-tooltip input {
          background-color: ${COLORS.SecondaryBackground} !important;
          color: ${COLORS.MainText} !important;
          border: 1px solid ${COLORS.TextInput} !important;
          border-radius: 3px !important;
          padding: 5px;
        }
        .ql-tooltip .ql-action {
          color: ${COLORS.Primary} !important;
        }

        /* 4) Spoiler styling: grey background, white text */
        .spoiler {
          background-color: ${COLORS.InactiveText} !important;
          color: ${COLORS.White} !important;
          border-radius: 3px;
          padding: 2px 6px;
        }
      `;
            document.head.appendChild(styleEl);
            return () => {
                if (document.head.contains(styleEl)) {
                    document.head.removeChild(styleEl);
                }
            };
        }
    }, []);

    // ---- Web version with ReactQuill ----
    if (Platform.OS === 'web') {
        const [value, setValue] = useState(initialContent);

        const modules = (ReactQuill as any).modules || {
            toolbar: [
                ['bold', 'italic', 'underline'],
                [{ header: [1, 2, 3, false] }],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['link', 'spoiler', 'blockquote'],
                ['clean'],
            ],
        };

        return (
            <View style={styles.webContainer}>
                <ReactQuill
                    ref={quillRef}
                    value={value}
                    onChange={(content: string) => {
                        setValue(content);
                        onChange(content);
                    }}
                    modules={modules}
                    theme="snow"
                    style={styles.webEditor}
                />
            </View>
        );
    }

    // ---- Mobile version using Pell Rich Editor ----
    const richTextRef = useRef<RichEditor>(null);

    // State for link insertion modal (mobile)
    const [linkModalVisible, setLinkModalVisible] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');

    const handleInsertLink = () => {
        setLinkUrl('');
        setLinkModalVisible(true);
    };

    const onInsertLink = () => {
        if (linkUrl.trim() !== '') {
            richTextRef.current?.insertLink(linkUrl, linkUrl);
        }
        setLinkModalVisible(false);
        setLinkUrl('');
    };

    // Spoiler insertion on mobile
    const handleToggleSpoiler = () => {
        richTextRef.current?.insertHTML(`<span class="spoiler">Spoiler</span>`);
    };

    return (
        <View style={styles.mobileContainer}>
            <RichEditor
                ref={richTextRef}
                initialContentHTML={initialContent}
                style={styles.mobileEditor}
                onChange={onChange}
                editorStyle={{
                    backgroundColor: COLORS.PrimaryBackground,
                    color: COLORS.MainText,
                    placeholderColor: COLORS.InactiveText,
                }}
            />
            <RichToolbar
                editor={richTextRef}
                actions={[
                    'bold',
                    'italic',
                    'underline',
                    'heading1',
                    'heading2',
                    'insertLink',
                    'spoiler',
                ]}
                style={styles.mobileToolbar}
                iconTint={COLORS.MainText}
                selectedIconTint={COLORS.Primary}
                selectedButtonStyle={{ backgroundColor: 'transparent' }}
                onPressAddLink={handleInsertLink}
                onPress={(action) => {
                    if (action === 'spoiler') {
                        handleToggleSpoiler();
                    }
                }}
                iconMap={{
                    spoiler: () => (
                        <Text style={{ color: COLORS.MainText, fontSize: 18 }}>
                            🙈
                        </Text>
                    ),
                }}
            />

            {/* Link insertion modal on mobile */}
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
                            placeholder="Enter URL"
                            placeholderTextColor={COLORS.InactiveText}
                            style={styles.linkInput}
                            value={linkUrl}
                            onChangeText={setLinkUrl}
                            autoCapitalize="none"
                            keyboardType="url"
                        />
                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    styles.cancelButton,
                                ]}
                                onPress={() => setLinkModalVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    styles.insertButton,
                                ]}
                                onPress={onInsertLink}
                            >
                                <Text style={styles.modalButtonText}>
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

// ===== STYLES =====
const styles = StyleSheet.create({
    // Web
    webContainer: {
        flex: 1,
        margin: 10,
        backgroundColor: COLORS.PrimaryBackground,
        borderRadius: 5,
        padding: 5,
    },
    webEditor: {
        color: COLORS.MainText,
        backgroundColor: COLORS.TextInput,
    },

    // Mobile
    mobileContainer: {
        flex: 1,
        margin: 10,
        backgroundColor: COLORS.PrimaryBackground,
        borderRadius: 5,
        padding: 5,
    },
    mobileEditor: {
        flex: 1,
        minHeight: 200,
        borderWidth: 1,
        borderColor: COLORS.InactiveText,
        padding: 10,
        color: COLORS.MainText,
    },
    mobileToolbar: {
        borderTopWidth: 1,
        borderColor: COLORS.InactiveText,
        backgroundColor: COLORS.TextInput,
    },

    // Mobile link modal
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
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
        color: COLORS.White,
    },
    linkInput: {
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
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
        marginLeft: 10,
    },
    cancelButton: {
        backgroundColor: COLORS.Primary,
    },
    insertButton: {
        backgroundColor: COLORS.Primary,
    },
    modalButtonText: {
        color: COLORS.White,
        fontWeight: '600',
    },
});
