import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import TurndownService from 'turndown';
import { marked } from 'marked';
import { COLORS } from '../constants';
import { gfm } from 'turndown-plugin-gfm';

marked.use({
    extensions: [
        {
            name: 'spoiler',
            level: 'inline',
            start(src) {
                const discordIndex = src.indexOf('||');
                const redditIndex = src.indexOf('>!');
                if (discordIndex === -1 && redditIndex === -1) return -1;
                if (discordIndex === -1) return redditIndex;
                if (redditIndex === -1) return discordIndex;
                return Math.min(discordIndex, redditIndex);
            },
            tokenizer(src, tokens) {
                const discordMatch = /^(\|\|)([\s\S]+?)\1/.exec(src);
                if (discordMatch) {
                    return {
                        type: 'spoiler',
                        raw: discordMatch[0],
                        text: discordMatch[2],
                    };
                }
                const redditMatch = /^(>!)([\s\S]+?)(!<)/.exec(src);
                if (redditMatch) {
                    return {
                        type: 'spoiler',
                        raw: redditMatch[0],
                        text: redditMatch[2],
                    };
                }
            },
            renderer(token) {
                return `<span class="spoiler">${token.text}</span>`;
            },
        },
    ],
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ReactQuill: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Quill: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Inline: any;

if (Platform.OS === 'web') {
    ReactQuill = require('react-quill-new').default;
    require('react-quill-new/dist/quill.snow.css');
    require('quill-better-table/dist/quill-better-table.css');
    Quill = require('react-quill-new').Quill;
    (window as any).Quill = Quill;

    // Force Quill to render code blocks correctly:
    const CodeBlock = Quill.import('formats/code-block');
    CodeBlock.create = function (value) {
        const node = document.createElement('pre');
        node.setAttribute('spellcheck', 'false');
        node.classList.add('ql-syntax');
        return node;
    };
    Quill.register(CodeBlock, true);

    const QuillBetterTable = require('quill-better-table');
    Quill.register({ 'modules/better-table': QuillBetterTable }, true);
    Inline = Quill.import('blots/inline');

    // (Optional) Our custom bullet list item blot is still registered
    // so that a custom bullet marker appears in the editor.
    let ListItem: any;
    try {
        ListItem = Quill.import('formats/list/item');
    } catch (e) {
        ListItem = Quill.import('formats/list-item');
    }
    if (ListItem) {
        class CustomBulletListItem extends ListItem {
            attach() {
                super.attach();
                if (
                    this.domNode.parentNode &&
                    this.domNode.parentNode.tagName.toLowerCase() === 'ul'
                ) {
                    if (!this.domNode.querySelector('.custom-bullet')) {
                        const bulletSpan = document.createElement('span');
                        bulletSpan.classList.add('custom-bullet');
                        bulletSpan.innerText = '• ';
                        this.domNode.insertBefore(
                            bulletSpan,
                            this.domNode.firstChild
                        );
                    }
                }
            }
        }
        CustomBulletListItem.blotName = 'list-item';
        CustomBulletListItem.tagName = 'LI';
        Quill.register(CustomBulletListItem, true);
    }

    // Register Spoiler blot.
    class SpoilerBlot extends Inline {
        static create() {
            const node = super.create();
            node.setAttribute('class', 'spoiler');
            node.append(document.createTextNode('\u200B'));
            return node;
        }
        static formats(node: HTMLElement) {
            return node.getAttribute('class') === 'spoiler';
        }
        static value(node: HTMLElement) {
            return node.innerText.replaceAll('​', '');
        }
    }
    SpoilerBlot.blotName = 'spoiler';
    SpoilerBlot.tagName = 'span';
    Quill.register(SpoilerBlot);

    const icons = Quill.import('ui/icons');
    icons.spoiler = `
    <svg viewBox="0 0 24 24">
      <title>Spoiler</title>
      <path d="M12,2L2,7v7c0,5,4,9,10,9s10-4,10-9V7L12,2z M12,17 c-3,0-5-2-5-5v-1l5-3l5,3v1C17,15,15,17,12,17z"/>
    </svg>
  `;
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

    // Toolbar handlers.
    const toolbarHandlers = {
        spoiler() {
            const range = this.quill.getSelection();
            if (!range) return;
            if (range.length > 0) {
                const currentFormat = this.quill.getFormat(range);
                const isActive = !!currentFormat.spoiler;
                this.quill.formatText(
                    range.index,
                    range.length,
                    'spoiler',
                    !isActive
                );
            } else {
                const insertIndex = range.index;
                this.quill.insertText(insertIndex, '\u200B', { spoiler: true });
                this.quill.setSelection(insertIndex + 1, 0);
            }
        },
        bullet() {
            const range = this.quill.getSelection();
            if (!range) return;
            const currentFormat = this.quill.getFormat(range);
            const isActive = currentFormat.list === 'bullet';
            // Toggle list formatting.
            this.quill.format('list', isActive ? false : 'bullet');
            // After formatting, mark the list container as bullet.
            setTimeout(() => {
                const editor = this.quill.root;
                const lists = editor.querySelectorAll('.ql-list');
                lists.forEach((list) => {
                    list.setAttribute('data-bullet', 'true');
                });
            }, 0);
        },
        insertTable() {
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
            const tableModule = this.quill.getModule('better-table');
            if (tableModule) {
                tableModule.insertTable(rows, columns);
            }
        },
    };

    ReactQuill.modules = {
        toolbar: {
            container: [
                ['bold', 'italic', 'underline'],
                [{ header: [1, 2, 3, false] }],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['link', 'spoiler', 'blockquote', 'code-block'],
                ['clean'],
                ['insertTable'],
            ],
            handlers: toolbarHandlers,
        },
        table: false,
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
        keyboard: {
            bindings: QuillBetterTable.keyboardBindings,
        },
    };
}

interface RichTextEditorWebProps {
    initialContent?: string;
    onChange: (markdown: string) => void;
}

export const RichTextEditorWeb: React.FC<RichTextEditorWebProps> = ({
    initialContent = '',
    onChange,
}) => {
    if (Platform.OS !== 'web') {
        return (
            <View style={styles.container}>
                <Text>Rich text editor is not available on mobile</Text>
            </View>
        );
    }

    const turndownService = new TurndownService({ codeBlockStyle: 'fenced' });
    turndownService.use(gfm);

    turndownService.addRule('spoiler', {
        filter: (node, options) =>
            node.nodeName === 'SPAN' &&
            node.getAttribute('class') &&
            node.getAttribute('class')!.includes('spoiler'),
        replacement: (content, node, options) => `||${content}||`,
    });

    if (turndownService.rules.fencedCodeBlock)
        delete turndownService.rules.fencedCodeBlock;
    if (turndownService.rules.codeBlock) delete turndownService.rules.codeBlock;
    turndownService.addRule('quillCodeBlock', {
        order: Infinity,
        filter: function (node) {
            if (node.nodeType !== 1) return false;
            const tag = node.tagName.toLowerCase();
            if ((tag === 'pre' || tag === 'p') && node.classList) {
                return (
                    node.classList.contains('ql-syntax') ||
                    node.classList.contains('ql-code-block')
                );
            }
            return false;
        },
        replacement: function (content, node) {
            let code = (node.textContent || '').replace(/\u200B/g, '').trim();
            if (!code) {
                code = (node.innerHTML || '')
                    .replace(/<br\s*\/?>/gi, '\n')
                    .replace(/<[^>]+>/g, '')
                    .trim();
            }
            console.log('Custom code block detected:', node.outerHTML);
            console.log('Extracted code:', code);
            return `\n\n\`\`\`\n${code}\n\`\`\`\n\n`;
        },
    });

    if (turndownService.rules.table) delete turndownService.rules.table;
    turndownService.addRule('quillTable', {
        filter: function (node) {
            return (
                node.nodeType === 1 &&
                node.tagName.toLowerCase() === 'table' &&
                node.classList.contains('quill-better-table')
            );
        },
        replacement: function (content, node) {
            const rows = Array.from(node.querySelectorAll('tr'));
            if (!rows.length) return content;
            const tableData = rows.map((row) => {
                const cells = Array.from(row.querySelectorAll('td, th'));
                return cells.map((cell) => (cell.textContent || '').trim());
            });
            const numCols = Math.max(...tableData.map((row) => row.length));
            tableData.forEach((row) => {
                while (row.length < numCols) {
                    row.push('');
                }
            });
            const header = tableData[0];
            const separator = new Array(numCols).fill('---');
            const body = tableData.slice(1);
            const headerMarkdown = '| ' + header.join(' | ') + ' |';
            const separatorMarkdown = '| ' + separator.join(' | ') + ' |';
            const bodyMarkdown = body
                .map((row) => '| ' + row.join(' | ') + ' |')
                .join('\n');
            return (
                '\n\n' +
                headerMarkdown +
                '\n' +
                separatorMarkdown +
                (bodyMarkdown ? '\n' + bodyMarkdown : '') +
                '\n\n'
            );
        },
    });

    // CUSTOM LIST RULE:
    // Override Turndown’s default list conversion so that any list with class "ql-list" is output as bullet markdown.
    if (turndownService.rules.list) delete turndownService.rules.list;
    turndownService.addRule('qlListBullet', {
        filter: function (node) {
            return (
                (node.nodeName === 'OL' || node.nodeName === 'UL') &&
                node.classList.contains('ql-list')
            );
        },
        replacement: function (content, node) {
            const listItems = Array.from(node.querySelectorAll('li'));
            return listItems
                .map((li) => `- ${li.textContent.trim()}`)
                .join('\n');
        },
    });

    const preprocessHTML = (html: string) =>
        html.replace(/<\/ol>\s*<ul>/g, '</ol><p><br></p><ul>');

    const initialHTML = initialContent ? marked(initialContent) : '';
    const quillRef = useRef<any>(null);
    const [value, setValue] = useState(initialHTML);

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
      .ql-editor table,
      .ql-editor table th,
      .ql-editor table td {
        border: 1px solid ${COLORS.White} !important;
      }
      /* Custom bullet style */
      .custom-bullet {
        display: inline-block;
        width: 1em;
        margin-right: 0.2em;
        color: ${COLORS.Primary};
      }
    `;
        document.head.append(styleEl);
        return () => {
            if (document.head.contains(styleEl)) styleEl.remove();
        };
    }, []);

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
        const fixedContent = preprocessHTML(content);
        const markdown = turndownService.turndown(fixedContent);
        console.log('Final markdown output:', JSON.stringify(markdown));
        onChange(markdown);
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
    container: { flex: 1 },
    webEditor: { minHeight: 200 },
});
