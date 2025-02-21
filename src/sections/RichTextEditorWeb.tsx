import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { COLORS } from '../constants';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ReactQuill: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Quill: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Inline: any;

if (Platform.OS === 'web') {
    // Use react-quill-new for web and load its CSS
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires, unicorn/prefer-module
    ReactQuill = require('react-quill-new').default;
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires, unicorn/prefer-module
    require('react-quill-new/dist/quill.snow.css');

    // Load quill-better-table CSS
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires, unicorn/prefer-module
    require('quill-better-table/dist/quill-better-table.css');

    // Get the Quill instance from react-quill-new
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires, unicorn/prefer-module
    Quill = require('react-quill-new').Quill;
    // Expose Quill globally for quill-better-table requirements
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Quill = Quill;

    // Import quill-better-table
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires, unicorn/prefer-module
    const QuillBetterTable = require('quill-better-table');

    // Register quill-better-table module with Quill
    Quill.register(
        {
            'modules/better-table': QuillBetterTable,
        },
        true
    );

    // Get Inline blot for custom formatting
    Inline = Quill.import('blots/inline');

    // ====== Custom Spoiler Blot (Web) ======
    class SpoilerBlot extends Inline {
        static create() {
            const node = super.create();
            node.setAttribute('class', 'spoiler');
            node.append(document.createTextNode('\u200B')); // zero-width space
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return node;
        }

        static formats(node: HTMLElement) {
            return node.getAttribute('class') === 'spoiler';
        }

        static value(node: HTMLElement) {
            // eslint-disable-next-line unicorn/prefer-dom-node-text-content
            return node.innerText.replaceAll('​', '');
        }
    }
    SpoilerBlot.blotName = 'spoiler';
    SpoilerBlot.tagName = 'span';
    Quill.register(SpoilerBlot);

    // ====== Custom Icons & Toolbar Handlers ======
    const icons = Quill.import('ui/icons');

    // Spoiler icon (already defined)
    icons.spoiler = `
    <svg viewBox="0 0 24 24">
      <title>Spoiler</title>
      <path d="M12,2L2,7v7c0,5,4,9,10,9s10-4,10-9V7L12,2z M12,17 c-3,0-5-2-5-5v-1l5-3l5,3v1C17,15,15,17,12,17z"/>
    </svg>
  `;

    // Define table icon (icon markup itself need not include title)
    icons.insertTable = `
    <svg viewBox="0 0 18 18">
      <rect class="ql-stroke" height="12" width="12" x="3" y="3"></rect>
      <line class="ql-stroke" x1="3" x2="15" y1="7" y2="7"></line>
      <line class="ql-stroke" x1="3" x2="15" y1="11" y2="11"></line>
      <line class="ql-stroke" x1="7" x2="7" y1="3" y2="15"></line>
      <line class="ql-stroke" x1="11" x2="11" y1="3" y2="15"></line>
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
    } catch (error) {
        console.warn('Could not add hover titles to some icons:', error);
    }

    const toolbarHandlers = {
        spoiler() {
            // @ts-expect-error quill
            const range = this.quill.getSelection();
            if (!range) return;
            if (range.length > 0) {
                // Toggle spoiler on selected text
                // @ts-expect-error quill
                const currentFormat = this.quill.getFormat(range);
                const isActive = !!currentFormat.spoiler;
                // @ts-expect-error quill
                this.quill.formatText(
                    range.index,
                    range.length,
                    'spoiler',
                    !isActive
                );

                setTimeout(() => {
                    // @ts-expect-error quill
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
                // @ts-expect-error quill
                this.quill.insertText(insertIndex, '\u200B', { spoiler: true });
                // @ts-expect-error quill
                this.quill.setSelection(insertIndex + 1, 0);

                setTimeout(() => {
                    // @ts-expect-error quill
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
        insertTable() {
            // Prompt the user for number of rows and columns
            const rowsInput = window.prompt('Enter number of rows', '3');
            const columnsInput = window.prompt('Enter number of columns', '3');
            const rows = Number.parseInt(rowsInput ?? '', 10);
            const columns = Number.parseInt(columnsInput ?? '', 10);
            if (
                Number.isNaN(rows) ||
                Number.isNaN(columns) ||
                rows < 1 ||
                columns < 1
            ) {
                alert('Invalid number of rows or columns');
                return;
            }
            // Get the better-table module and insert the table with user-defined dimensions
            // @ts-expect-error quilll module
            const tableModule = this.quill.getModule('better-table');
            if (tableModule) {
                tableModule.insertTable(rows, columns);
            }
        },
    };

    // ====== Define ReactQuill Modules (with Better Table) ======
    ReactQuill.modules = {
        toolbar: {
            container: [
                ['bold', 'italic', 'underline'],
                [{ header: [1, 2, 3, false] }],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['link', 'spoiler', 'blockquote', 'code-block'],
                ['clean'],
                // New row for table insertion button
                ['insertTable'],
            ],
            handlers: toolbarHandlers,
        },
        // Disable default table module
        table: false,
        // Add quill-better-table configuration
        'better-table': {
            operationMenu: {
                items: {
                    insertColumnRight: { text: 'Insert Column Right' },
                    insertColumnLeft: { text: 'Insert Column Left' },
                    insertRowUp: { text: 'Insert Row Above' },
                    insertRowDown: { text: 'Insert Row Below' },
                    mergeCells: { text: 'Merge Cells' },
                    unmergeCells: { text: 'Unmerge Cells' },
                    deleteColumn: { text: 'Delete Column' },
                    deleteRow: { text: 'Delete Row' },
                    deleteTable: { text: 'Delete Table' },
                },
                color: {
                    colors: ['#fff', 'red', 'rgb(0, 0, 0)'],
                    text: 'Background Colors',
                },
            },
        },
        // Set keyboard bindings for table operations
        keyboard: {
            bindings: QuillBetterTable.keyboardBindings,
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
    // Fallback for mobile platforms
    if (Platform.OS !== 'web') {
        return (
            <View style={styles.container}>
                <Text>Rich text editor is not available on mobile</Text>
            </View>
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      /* CSS rule to set the table outline (borders) to white */
      .ql-editor table,
      .ql-editor table th,
      .ql-editor table td {
        border: 1px solid ${COLORS.White} !important;
      }
    `;
        document.head.append(styleEl);
        return () => {
            if (document.head.contains(styleEl)) {
                styleEl.remove();
            }
        };
    }, []);

    // Delay adding title and aria-label to allow the toolbar button to render
    useEffect(() => {
        setTimeout(() => {
            const btn = document.querySelector('.ql-insertTable');
            if (btn) {
                btn.setAttribute('title', 'Insert Table');
                btn.setAttribute('aria-label', 'Insert Table');
            }
        }, 500);
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
                modules={ReactQuill.modules}
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
