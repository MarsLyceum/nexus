import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { marked } from 'marked';
import { COLORS } from '../constants';
import { gfm } from 'turndown-plugin-gfm';
// Import the deltaToMarkdown conversion method.
import { deltaToMarkdown } from 'quill-delta-to-markdown';

if (Platform.OS === 'web') {
    // Load Quill CSS for web
    require('react-quill-new/dist/quill.snow.css');
    // Optionally, remove Better Table CSS if not needed:
    // require('quill-better-table/dist/quill-better-table.css');
}

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

interface RichTextEditorWebProps {
    initialContent?: string;
    onChange: (markdown: string) => void;
}

// --- New Conversion Function ---
// This function first “patches” the ops by checking if an op should be treated as a code op
// based on its own attributes or if the next op is a newline with code-block.
// Then it segments the ops into code and non-code groups and processes each group.
function convertDeltaToMarkdownWithFencesAndFormatting(ops: any[]): string {
    type Segment = { isCode: boolean; ops: any[] };
    const segments: Segment[] = [];
    let currentSegment: Segment | null = null;

    for (let i = 0; i < ops.length; i++) {
        const op = ops[i];
        // Determine if this op should be treated as code.
        let opIsCode = false;
        if (op.attributes && op.attributes['code-block']) {
            opIsCode = true;
        } else if (
            i + 1 < ops.length &&
            ops[i + 1].insert === '\n' &&
            ops[i + 1].attributes &&
            ops[i + 1].attributes['code-block']
        ) {
            opIsCode = true;
        }

        if (!currentSegment) {
            currentSegment = { isCode: opIsCode, ops: [op] };
        } else if (currentSegment.isCode === opIsCode) {
            currentSegment.ops.push(op);
        } else {
            segments.push(currentSegment);
            currentSegment = { isCode: opIsCode, ops: [op] };
        }
    }
    if (currentSegment) {
        segments.push(currentSegment);
    }

    let markdown = '';
    segments.forEach((segment) => {
        if (segment.isCode) {
            // For code segments, join all inserted text.
            const codeText = segment.ops.map((op) => op.insert).join('');
            markdown += `\n\`\`\`\n${codeText}\n\`\`\`\n`;
        } else {
            // For non-code segments, use deltaToMarkdown to preserve formatting.
            const nonCodeMarkdown = deltaToMarkdown(segment.ops);
            markdown += nonCodeMarkdown;
        }
    });
    return markdown;
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

    const initialHTML = useMemo(() => {
        return initialContent ? marked(initialContent) : '<p><br></p>';
    }, [initialContent]);

    const [bulletMode, setBulletMode] = useState<boolean>(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Compute srcDoc only once on mount.
    const srcDoc = useMemo(() => {
        return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Quill Editor Iframe</title>
    <!-- Quill CSS -->
    <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
    <style>
      html, body { margin: 0; padding: 0; height: 100%; width: 100%; }
      #editor { height: 100%; width: 100%; }
      .ql-container.ql-snow {
        border: 1px solid ${COLORS.TextInput} !important;
        border-radius: 5px !important;
        height: 200px !important;
        width: 100% !important;
        max-width: none !important;
      }
      .ql-editor {
        height: 100% !important;
        padding: 10px !important;
        box-sizing: border-box;
        color: ${COLORS.MainText} !important;
        background-color: ${COLORS.PrimaryBackground} !important;
      }
      .ql-editor.ql-blank::before { color: ${COLORS.MainText} !important; }
      .ql-toolbar button svg { stroke: ${COLORS.MainText} !important; fill: ${COLORS.MainText} !important; }
      .ql-stroke { stroke: ${COLORS.MainText} !important; }
      .ql-fill { fill: ${COLORS.MainText} !important; }
      .ql-toolbar button:hover svg,
      .ql-toolbar button.ql-active svg {
        stroke: ${COLORS.Primary} !important; fill: ${COLORS.Primary} !important;
      }
      .ql-toolbar button:hover .ql-stroke,
      .ql-toolbar button.ql-active .ql-stroke { stroke: ${COLORS.Primary} !important; }
      .ql-toolbar button:hover .ql-fill,
      .ql-toolbar button.ql-active .ql-fill { fill: ${COLORS.Primary} !important; }
      .ql-toolbar .ql-picker-label,
      .ql-toolbar .ql-picker-item { color: ${COLORS.MainText} !important; }
      .ql-toolbar .ql-picker-label:hover,
      .ql-toolbar .ql-picker-item:hover,
      .ql-toolbar .ql-picker-label.ql-active,
      .ql-toolbar .ql-picker-item.ql-selected { color: ${COLORS.Primary} !important; }
      .ql-picker-options {
        background-color: ${COLORS.AppBackground} !important;
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
      .ql-tooltip .ql-action { color: ${COLORS.Primary} !important; }
      .spoiler {
        background-color: ${COLORS.InactiveText} !important;
        color: ${COLORS.White} !important;
        border-radius: 3px;
        padding: 2px 6px;
      }
      .ql-editor table,
      .ql-editor table th,
      .ql-editor table td { border: 1px solid ${COLORS.White} !important; }
      .custom-bullet {
        display: inline-block; width: 1em; margin-right: 0.2em; color: ${COLORS.Primary};
      }
    </style>
  </head>
  <body>
    <div id="editor">${initialHTML}</div>
    <!-- Load Quill JS -->
    <script src="https://cdn.quilljs.com/1.3.6/quill.js"></script>
    <script>
      window.initQuill = function() {
        // Removed Better Table integration to avoid runtime errors
        
        var CodeBlock = Quill.import('formats/code-block');
        CodeBlock.create = function() {
          var node = document.createElement('pre');
          node.setAttribute('spellcheck', 'false');
          node.classList.add('ql-syntax');
          return node;
        };
        Quill.register(CodeBlock, true);
      
        var Inline = Quill.import('blots/inline');
        class SpoilerBlot extends Inline {
          static create() {
            var node = super.create();
            node.setAttribute('class', 'spoiler');
            node.append(document.createTextNode('\\u200B'));
            return node;
          }
          static formats(node) { return node.getAttribute('class') === 'spoiler'; }
          static value(node) { return node.innerText.replaceAll('\\u200B', ''); }
        }
        SpoilerBlot.blotName = 'spoiler';
        SpoilerBlot.tagName = 'span';
        Quill.register(SpoilerBlot);
      
        var icons = Quill.import('ui/icons');
        icons.spoiler = '<svg viewBox="0 0 24 24"><title>Spoiler</title><path d="M12,2L2,7v7c0,5,4,9,10,9s10-4,10-9V7L12,2z M12,17 c-3,0-5-2-5-5v-1l5-3l5,3v1C17,15,15,17,12,17z"/></svg>';
      
        var toolbarHandlers = {
          spoiler: function() {
            var range = this.quill.getSelection();
            if (!range) return;
            if (range.length > 0) {
              var currentFormat = this.quill.getFormat(range);
              var isActive = !!currentFormat.spoiler;
              this.quill.formatText(range.index, range.length, 'spoiler', !isActive);
            } else {
              var insertIndex = range.index;
              this.quill.insertText(insertIndex, '\\u200B', { spoiler: true });
              this.quill.setSelection(insertIndex + 1, 0);
            }
          },
          bullet: function() {
            var range = this.quill.getSelection();
            if (!range) return;
            var currentFormat = this.quill.getFormat(range);
            var isActive = currentFormat.list === 'bullet';
            this.quill.format('list', isActive ? false : 'bullet');
          }
        };
      
        var myQuill = new Quill('#editor', {
          theme: 'snow',
          modules: {
            toolbar: {
              container: [
                ['bold', 'italic', 'underline'],
                [{ header: [1, 2, 3, false] }],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['link', 'spoiler', 'blockquote', 'code-block'],
                ['clean']
              ],
              handlers: toolbarHandlers
            },
            keyboard: {}
          },
          placeholder: "Start typing..."
        });
      
        window.parent.postMessage({ type: 'iframe-init', message: 'Quill editor loaded' }, '*');
        myQuill.on('text-change', function(delta) {
          window.parent.postMessage({ type: 'content-change', delta: myQuill.getContents() }, '*');
        });
      
        setTimeout(function() {
          var btn = document.querySelector('.ql-insertTable');
          if (btn) {
            btn.setAttribute('title', 'Insert Table');
            btn.setAttribute('aria-label', 'Insert Table');
          }
        }, 500);
      };
    </script>
    <!-- Call initQuill after the DOM is loaded -->
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        if (typeof window.initQuill === 'function') {
          window.initQuill();
        } else {
          console.error("initQuill function is not defined.");
        }
      });
    </script>
  </body>
</html>
        `;
    }, []);

    useEffect(() => {
        const messageHandler = (event: MessageEvent) => {
            console.log('Received message:', event.data);
            if (event.data && event.data.type === 'content-change') {
                const delta = event.data.delta;
                // If bulletMode is active, convert ordered list ops to bullet list ops.
                if (bulletMode && delta.ops) {
                    delta.ops = delta.ops.map((op: any) => {
                        if (op.attributes && op.attributes.list === 'ordered') {
                            return {
                                ...op,
                                attributes: {
                                    ...op.attributes,
                                    list: 'bullet',
                                },
                            };
                        }
                        return op;
                    });
                }
                // Pre-process delta ops: wrap spoiler-marked text with Discord markdown.
                if (delta.ops) {
                    delta.ops = delta.ops.map((op: any) => {
                        if (
                            op.attributes &&
                            op.attributes.spoiler &&
                            typeof op.insert === 'string'
                        ) {
                            return {
                                ...op,
                                insert: `||${op.insert}||`,
                            };
                        }
                        return op;
                    });
                }
                // --- Use our new conversion function ---
                const markdown = convertDeltaToMarkdownWithFencesAndFormatting(
                    delta.ops
                );
                console.log('Final markdown output:', markdown);
                onChange(markdown);
            }
        };
        window.addEventListener('message', messageHandler);
        return () => window.removeEventListener('message', messageHandler);
    }, [onChange, bulletMode]);

    return (
        <View style={styles.container}>
            <style>{`
        .my-editor-iframe {
          width: 100% !important;
          height: 100% !important;
          transform: none !important;
        }
      `}</style>
            <div style={styles.flexWrapper}>
                <iframe
                    ref={iframeRef}
                    className="my-editor-iframe"
                    title="Quill Editor Iframe"
                    srcDoc={srcDoc}
                    style={styles.webEditor}
                />
            </div>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '250px',
        display: 'flex',
        flexDirection: 'column',
    },
    flexWrapper: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
    },
    webEditor: {
        flex: 1,
        width: '100%',
        height: '100%',
        border: 'none',
    },
});
