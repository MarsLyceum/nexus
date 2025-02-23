import { marked } from 'marked';
import { COLORS } from '../constants';

// --- Custom Marked Extension for Spoilers ---
const spoilerExtension = {
    name: 'spoiler',
    level: 'inline', // This is an inline-level tokenizer.
    start(src: string) {
        // Find the earliest index of either Discord or Reddit spoiler tokens.
        const discordIndex = src.indexOf('||');
        const redditIndex = src.indexOf('>!');
        if (discordIndex === -1) return redditIndex;
        if (redditIndex === -1) return discordIndex;
        return Math.min(discordIndex, redditIndex);
    },
    tokenizer(src: string) {
        // Remove common zero-width characters so that invisible characters don’t interfere.
        const cleaned = src.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');
        // Handle Discord-style spoilers: ||spoiler||
        if (cleaned.startsWith('||')) {
            // Revised regex:
            // - Matches opening "||"
            // - Captures one or more non-pipe, non-newline characters (allowing internal single pipes)
            // - Matches closing "||" only if immediately followed by the end-of-string or a newline.
            const match = /^\|\|([^|\n]+(?:\|(?!\|)[^|\n]+)*)\|\|(?=$|\n)/.exec(
                cleaned
            );
            if (match) {
                return {
                    type: 'spoiler',
                    raw: match[0],
                    text: match[1].trim(),
                };
            }
        }
        // Handle Reddit-style spoilers: >!spoiler!<
        if (src.startsWith('>!')) {
            const match = /^>!([^!]+(?:!(?!<)[^!]+)*)!</.exec(src);
            if (match) {
                return {
                    type: 'spoiler',
                    raw: match[0],
                    text: match[1].trim(),
                };
            }
        }
    },
    renderer(token: any) {
        return `<span class="spoiler">${token.text}</span>`;
    },
};

// Register the extension with marked.
marked.use({ extensions: [spoilerExtension] });

export function getRichTextEditorHtml(initialContent: string = ''): string {
    const initialHTML = initialContent ? marked(initialContent) : '<p><br></p>';
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Quill Editor Iframe</title>
    <!-- Quill CSS -->
    <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
    <style>
      html, body { 
        margin: 0; 
        padding: 0; 
        height: 100%; 
        width: 100%; 
        background-color: ${COLORS.AppBackground} !important;
      }
      #editor { width: 100%; }
      .ql-container.ql-snow {
        border: 1px solid ${COLORS.TextInput} !important;
        border-radius: 5px !important;
        height: 80vh !important;
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
      .ql-toolbar {
        background-color: ${COLORS.AppBackground} !important;
      }
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
      // Initialize Quill editor and register custom formats.
      function initQuill() {
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
            // Removed insertion of zero-width space.
            return node;
          }
          static formats(node) { 
            return node.getAttribute('class') === 'spoiler'; 
          }
          static value(node) { 
            // Removed zero-width space removal as none are inserted.
            return node.innerText;
          }
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
            var currentFormat = this.quill.getFormat(range);
            // If text is selected, toggle spoiler format on that text.
            if (range.length > 0) {
              var isActive = !!currentFormat.spoiler;
              this.quill.formatText(range.index, range.length, 'spoiler', !isActive);
            } else {
              // Instead of inserting a zero-width space, toggle the format for future input.
              this.quill.format('spoiler', !currentFormat.spoiler);
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
      
        var quill = new Quill('#editor', {
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
            }
          },
          placeholder: "Start typing..."
        });
      
        // Add a clipboard matcher to ensure <span class="spoiler"> is parsed as a spoiler.
        quill.clipboard.addMatcher('span', function(node, delta) {
          if (node.classList && node.classList.contains('spoiler')) {
            delta.ops.forEach(op => {
              op.attributes = op.attributes || {};
              op.attributes.spoiler = true;
            });
          }
          return delta;
        });
      
        // Add titles to toolbar buttons and select elements for hover text.
        var toolbarModule = quill.getModule('toolbar');
        if (toolbarModule && toolbarModule.container) {
          const titleMapping = {
            'ql-bold': 'Bold',
            'ql-italic': 'Italic',
            'ql-underline': 'Underline',
            'ql-header': 'Header',
            'ql-list': { ordered: 'Ordered List', bullet: 'Bullet List' },
            'ql-link': 'Link',
            'ql-spoiler': 'Spoiler',
            'ql-blockquote': 'Blockquote',
            'ql-code-block': 'Code Block',
            'ql-clean': 'Clear Formatting'
          };
          toolbarModule.container.querySelectorAll('button, select').forEach(el => {
            for (const key in titleMapping) {
              if (el.classList.contains(key)) {
                if (typeof titleMapping[key] === 'object') {
                  const val = el.getAttribute('value');
                  if (val && titleMapping[key][val]) {
                    el.setAttribute('title', titleMapping[key][val]);
                  }
                } else {
                  el.setAttribute('title', titleMapping[key]);
                }
              }
            }
          });
        }
      
        // Unified postMessage function for both web (iframe) and mobile (WebView).
        var postMessageFn = (msg) => {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(msg);
          } else if (window.parent && window.parent.postMessage) {
            window.parent.postMessage(msg, '*');
          }
        };
      
        quill.on('text-change', function() {
          var delta = quill.getContents();
          postMessageFn(JSON.stringify({ type: 'text-change', delta: delta }));
        });
      
        postMessageFn(JSON.stringify({ type: 'iframe-init', message: 'Quill editor loaded' }));
      }
      
      document.addEventListener('DOMContentLoaded', function() {
        if (typeof initQuill === 'function') {
          initQuill();
        } else {
          console.error("initQuill function is not defined.");
        }
      });
    </script>
  </body>
</html>`;
}
export { getRichTextEditorHtml };
