import { marked } from 'marked';
import { COLORS } from '../constants';

// --- Custom Marked Extension for Spoilers ---
const spoilerExtension = {
    name: 'spoiler',
    level: 'inline',
    start(src: string) {
        const discordIndex = src.indexOf('||');
        const redditIndex = src.indexOf('>!');
        if (discordIndex === -1) return redditIndex;
        if (redditIndex === -1) return discordIndex;
        return Math.min(discordIndex, redditIndex);
    },
    tokenizer(src: string) {
        const cleaned = src.replaceAll(/[\u200B-\u200D\uFEFF]/g, '');
        if (cleaned.startsWith('||')) {
            const match = /^\|\|([^\n|]+(?:\|(?!\|)[^\n|]+)*)\|\|(?=$|\n)/.exec(
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

marked.use({ extensions: [spoilerExtension] });

export function getRichTextEditorHtml(
    placeholder: string = 'Start typing...',
    initialContent: string = '',
    showToolbar: boolean = true,
    height: string = '80vh',
    width: string = '100%',
    borderRadius: string = '5px',
    backgroundColor: string = COLORS.SecondaryBackground // new parameter for background color
): string {
    const editorHeight = height;
    const editorWidth = width;
    const initialHTML = initialContent ? marked(initialContent) : '<p><br></p>';
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=${editorWidth}, initial-scale=1">
    <title>Quill Editor Iframe</title>
    <!-- Quill CSS -->
    <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
    <style>
      html, body { 
        margin: 0;
        padding: 0;
        height: ${editorHeight} !important;
        width: ${editorWidth} !important;
      }
      .quill-wrapper {
        border: 1px solid ${COLORS.TextInput} !important;
        border-radius: ${borderRadius} !important;
        width: 100%;
        height: ${editorHeight} !important;
        background-color: ${backgroundColor} !important;
        overflow: hidden;
        box-sizing: border-box;
      }
      ${showToolbar ? `#toolbar-placeholder {}` : ''}
      #editor { 
        width: 100%; 
        height: ${showToolbar ? 'calc(100% - 40px)' : '100%'};
      }
      .ql-container.ql-snow,
      .ql-toolbar {
        border: none;
      }
      .ql-toolbar {
        border-top-left-radius: ${borderRadius} !important;
        border-top-right-radius: ${borderRadius} !important;
        background-color: ${backgroundColor} !important;
      }
      .ql-container.ql-snow {
        border-bottom-left-radius: ${borderRadius} !important;
        border-bottom-right-radius: ${borderRadius} !important;
        background-color: ${backgroundColor} !important;
      }
      ${
          !showToolbar
              ? `.ql-container.ql-snow {
        border-top-left-radius: ${borderRadius} !important;
        border-top-right-radius: ${borderRadius} !important;
      }`
              : ''
      }
      .ql-editor {
        height: 100% !important;
        padding: 10px !important;
        box-sizing: border-box;
        color: ${COLORS.MainText} !important;
        overflow-y: auto;
      }
      .ql-editor.ql-blank::before { 
        color: ${COLORS.MainText} !important;
      }
      .ql-toolbar button {
        color: ${COLORS.MainText} !important;
      }
      .ql-toolbar button svg { 
        stroke: ${COLORS.MainText} !important;
        fill: ${COLORS.MainText} !important;
      }
      .ql-stroke { 
        stroke: ${COLORS.MainText} !important;
      }
      .ql-fill { 
        fill: ${COLORS.MainText} !important;
      }
      .ql-toolbar button:hover svg,
      .ql-toolbar button.ql-active svg {
        stroke: ${COLORS.Secondary} !important;
        fill: ${COLORS.Secondary} !important;
      }
      .ql-toolbar button:hover .ql-stroke,
      .ql-toolbar button.ql-active .ql-stroke { 
        stroke: ${COLORS.Secondary} !important;
      }
      .ql-toolbar button:hover .ql-fill,
      .ql-toolbar button.ql-active .ql-fill { 
        fill: ${COLORS.Secondary} !important;
      }
      .ql-toolbar .ql-picker-label,
      .ql-toolbar .ql-picker-item { 
        color: ${COLORS.MainText} !important;
      }
      .ql-toolbar .ql-picker-label:hover,
      .ql-toolbar .ql-picker-item:hover,
      .ql-toolbar .ql-picker-label.ql-active,
      .ql-toolbar .ql-picker-item.ql-selected { 
        color: ${COLORS.Secondary} !important;
      }
      .ql-picker-options { 
        background-color: ${COLORS.AppBackground} !important;
      }
      .ql-tooltip {
        background-color: ${backgroundColor} !important;
        border: 1px solid ${COLORS.TextInput} !important;
        color: ${COLORS.MainText} !important;
        border-radius: 5px !important;
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
        color: ${COLORS.Secondary} !important;
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
        display: inline-block;
        width: 1em;
        margin-right: 0.2em;
        color: ${COLORS.Secondary};
      }
      /* Ensure the line in our spoiler icon inherits the correct color */
      .ql-toolbar button svg.ql-spoiler-icon line {
        stroke: currentColor !important;
      }
      /* Override spoiler icon line color on hover/active */
      .ql-toolbar button:hover svg.ql-spoiler-icon line,
      .ql-toolbar button.ql-active svg.ql-spoiler-icon line {
        stroke: ${COLORS.Secondary} !important;
      }
      /* Force the whole spoiler icon to adopt the secondary color on hover/active */
      .ql-toolbar button:hover svg.ql-spoiler-icon,
      .ql-toolbar button.ql-active svg.ql-spoiler-icon {
        color: ${COLORS.Secondary} !important;
      }
    </style>
  </head>
  <body>
    <div class="quill-wrapper">
      ${showToolbar ? `<div id="toolbar-placeholder"></div>` : ''}
      <div id="editor"></div>
    </div>
    <script src="https://cdn.quilljs.com/1.3.6/quill.js"></script>
    <script>
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
            return node;
          }
          static formats(node) { 
            return node.getAttribute('class') === 'spoiler';
          }
          static value(node) { 
            return node.innerText;
          }
        }
        SpoilerBlot.blotName = 'spoiler';
        SpoilerBlot.tagName = 'span';
        Quill.register(SpoilerBlot);
      
        // Define a custom icon for the spoiler button using an inline SVG with a custom class.
        var icons = Quill.import('ui/icons');
        icons['spoiler'] = '<svg class="ql-spoiler-icon" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M12 4.5c-4.97 0-9.27 3.11-11 7.5 1.73 4.39 6.03 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6.03-7.5-11-7.5zm0 13c-3.31 0-6-2.69-6-6 0-.89.22-1.73.61-2.46l8.85 8.85C13.73 17.78 12.89 18 12 18zm4.39-2.03l-8.85-8.85c.73-.39 1.57-.61 2.46-.61 3.31 0 6 2.69 6 6 0 .89-.22 1.73-.61 2.46z"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2"/></svg>';
      
        var toolbarHandlers = {
          spoiler: function() {
            var range = this.quill.getSelection();
            if (!range) return;
            var currentFormat = this.quill.getFormat(range);
            if (range.length > 0) {
              var isActive = !!currentFormat.spoiler;
              this.quill.formatText(range.index, range.length, 'spoiler', !isActive);
            } else {
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
      
        var showToolbar = ${JSON.stringify(showToolbar)};
        var quillOptions = {
          theme: 'snow',
          modules: {},
          placeholder: "${placeholder}"
        };
      
        if (showToolbar) {
          quillOptions.modules.toolbar = {
            container: [
              ['bold', 'italic', 'underline', 'strike'],
              [{ header: [1, 2, 3, false] }],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['link', 'spoiler', 'blockquote', 'code-block'],
              ['clean']
            ],
            handlers: toolbarHandlers
          };
        }
      
        var quill = new Quill('#editor', quillOptions);
      
        if (showToolbar) {
          var generatedToolbar = quill.container.parentNode.querySelector('.ql-toolbar');
          var toolbarPlaceholder = document.getElementById('toolbar-placeholder');
          if (generatedToolbar && toolbarPlaceholder) {
            toolbarPlaceholder.appendChild(generatedToolbar);
          }
        } else {
          // Explicitly remove any toolbar that may have been auto-generated.
          var defaultToolbar = quill.container.parentNode.querySelector('.ql-toolbar');
          if (defaultToolbar) {
            defaultToolbar.remove();
          }
        }
      
        quill.clipboard.addMatcher('span', function(node, delta) {
          if (node.classList && node.classList.contains('spoiler')) {
            delta.ops.forEach(op => {
              op.attributes = op.attributes || {};
              op.attributes.spoiler = true;
            });
          }
          return delta;
        });
      
        function strikeMatcher(node, delta) {
          const tag = node.tagName && node.tagName.toLowerCase();
          if (tag === 'del' || tag === 's') {
            delta.ops.forEach(op => {
              op.attributes = op.attributes || {};
              op.attributes.strike = true;
            });
          }
          return delta;
        }
        quill.clipboard.addMatcher('del', strikeMatcher);
        quill.clipboard.addMatcher('s', strikeMatcher);
      
        const initialHTML = ${JSON.stringify(initialHTML)};
        if (initialHTML) {
          const delta = quill.clipboard.convert(initialHTML);
          quill.setContents(delta, 'silent');
        }
      
        quill.root.addEventListener('focus', function() {
          postMessageFn(JSON.stringify({ type: 'focus', message: 'Editor focused' }));
        });
      
        quill.on('text-change', function() {
          var delta = quill.getContents();
          postMessageFn(JSON.stringify({ type: 'text-change', delta: delta }));
        });
      
        postMessageFn(JSON.stringify({ type: 'iframe-init', message: 'Quill editor loaded' }));
      
        function postMessageFn(msg) {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(msg);
          } else if (window.parent && window.parent.postMessage) {
            window.parent.postMessage(msg, '*');
          }
        }
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
