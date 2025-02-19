import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { COLORS } from '../constants';

let ReactQuill: any;
let Quill: any;
let Inline: any;

// Only load ReactQuill and related web-specific code if running on web
if (Platform.OS === 'web') {
    ReactQuill = require('react-quill');
    require('react-quill/dist/quill.snow.css');

    Quill = ReactQuill.Quill;
    Inline = Quill.import('blots/inline');

    // ====== Custom Spoiler Blot (Web) ======
    class SpoilerBlot extends Inline {
        static create() {
            const node = super.create();
            node.setAttribute('class', 'spoiler');
            node.appendChild(document.createTextNode('\u200B')); // zero-width space
            return node;
        }
        static formats(node: HTMLElement) {
            return node.getAttribute('class') === 'spoiler';
        }
        static value(node: HTMLElement) {
            return node.innerText.replace(/\u200B/g, '');
        }
    }
    SpoilerBlot.blotName = 'spoiler';
    SpoilerBlot.tagName = 'span';
    Quill.register(SpoilerBlot);

    // ====== Custom Spoiler Icon & Toolbar Handlers ======
    const icons = Quill.import('ui/icons');
    icons['spoiler'] = `
    <svg viewBox="0 0 24 24">
      <title>Spoiler</title>
      <path d="M12,2L2,7v7c0,5,4,9,10,9s10-4,10-9V7L12,2z M12,17 c-3,0-5-2-5-5v-1l5-3l5,3v1C17,15,15,17,12,17z"/>
    </svg>
  `;

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
        if (icons.blockquote) {
            icons.blockquote = icons.blockquote.replace(
                '<svg',
                '<svg><title>Blockquote</title>'
            );
        }
        if (icons['code-block']) {
            icons['code-block'] = icons['code-block'].replace(
                '<svg',
                '<svg><title>Code Block</title>'
            );
        }
    } catch (e) {
        console.warn('Could not add hover titles to some icons:', e);
    }

    const toolbarHandlers = {
        spoiler: function () {
            const range = this.quill.getSelection();
            if (!range) return;
            if (range.length > 0) {
                // Toggle spoiler on selected text
                const currentFormat = this.quill.getFormat(range);
                const isActive = !!currentFormat.spoiler;
                this.quill.formatText(
                    range.index,
                    range.length,
                    'spoiler',
                    !isActive
                );

                setTimeout(() => {
                    const [leaf] = this.quill.getLeaf(range.index);
                    if (leaf && leaf.parent?.statics?.blotName === 'spoiler') {
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
                // Insert a 1-char spoiler placeholder if no selection
                const insertIndex = range.index;
                this.quill.insertText(insertIndex, '\u200B', { spoiler: true });
                this.quill.setSelection(insertIndex + 1, 0);

                setTimeout(() => {
                    const [leaf] = this.quill.getLeaf(insertIndex);
                    if (leaf && leaf.parent?.statics?.blotName === 'spoiler') {
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
    };

    (ReactQuill as any).modules = {
        toolbar: {
            container: [
                ['bold', 'italic', 'underline'],
                [{ header: [1, 2, 3, false] }],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['link', 'spoiler', 'blockquote', 'code-block'],
                ['clean'],
            ],
            handlers: toolbarHandlers,
        },
    };
}

interface RichTextEditorWebProps {
    initialContent?: string;
    onChange: (html: string) => void;
}

export const RichTextEditorWeb: React.FC<RichTextEditorWebProps> = ({
    initialContent = '',
    onChange,
}) => {
    // Return a fallback for mobile platforms
    if (Platform.OS !== 'web') {
        return (
            <View style={styles.container}>
                <Text>Rich text editor is not available on mobile</Text>
            </View>
        );
    }

    const quillRef = useRef<any>(null);
    const [value, setValue] = useState(initialContent);

    useEffect(() => {
        const styleEl = document.createElement('style');
        styleEl.innerHTML = `
      /* Toolbar and Editor Styles */
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
        color: ${COLORS.MainText} !important;
        background-color: ${COLORS.PrimaryBackground} !important;
      }
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
    }, []);

    const handleChange = (content: string) => {
        setValue(content);
        onChange(content);
    };

    return (
        <View style={styles.container}>
            <ReactQuill
                ref={quillRef}
                value={value}
                onChange={handleChange}
                modules={(ReactQuill as any).modules}
                theme="snow"
                style={styles.webEditor}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    webEditor: {
        minHeight: 200,
    },
});
