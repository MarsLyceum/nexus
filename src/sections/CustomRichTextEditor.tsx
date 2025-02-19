// CustomRichTextEditor.tsx
import React from 'react';
import { Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { RichTextEditor } from './RichTextEditor'; // Slate-based editor for web (see below)
import { COLORS } from '../constants';

// Our main cross-platform component:
export const CustomRichTextEditor: React.FC<{
    onChange: (html: string) => void;
    initialContent?: string;
}> = ({ onChange, initialContent = '' }) => {
    // If platform is web, render the Slate-based editor directly.
    if (Platform.OS === 'web') {
        return (
            <RichTextEditor
                onChange={onChange}
                initialContent={initialContent}
            />
        );
    }
    // For mobile, load the editor in a WebView.
    // The HTML here is a full HTML document that loads our custom editor.
    const htmlContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { margin: 0; font-family: sans-serif; background: ${COLORS.AppBackground}; color: ${COLORS.White}; }
        .toolbar {
          display: flex;
          align-items: center;
          background-color: ${COLORS.TextInput};
          padding: 4px 8px;
        }
        .toolbar button {
          margin-left: 4px;
          padding: 4px;
          font-size: 16px;
          background: none;
          border: none;
          color: ${COLORS.MainText};
        }
        .toolbar button.active {
          color: ${COLORS.Primary} !important;
        }
        .dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          background-color: ${COLORS.PrimaryBackground};
          border: 1px solid ${COLORS.InactiveText};
          border-radius: 4px;
          width: 100%;
          z-index: 1000;
        }
        .dropdown div {
          padding: 8px 12px;
          cursor: pointer;
          color: ${COLORS.MainText};
          white-space: nowrap;
        }
        .editor {
          min-height: 200px;
          border: 1px solid ${COLORS.InactiveText};
          padding: 10px;
          margin-top: 8px;
          background-color: ${COLORS.AppBackground};
          color: ${COLORS.White};
        }
        spoiler {
          background-color: #eee;
          border: 1px dashed #999;
          cursor: pointer;
          padding: 2px 4px;
        }
        spoiler.revealed {
          background-color: transparent;
          border: none;
        }
      </style>
    </head>
    <body>
      <div class="toolbar">
        <button id="bold" title="Bold">B</button>
        <button id="italic" title="Italic">I</button>
        <button id="underline" title="Underline">U</button>
        <div style="position: relative; display: inline-block; min-width: 100px;">
          <button id="header" title="Header Format">Normal ▼</button>
          <div id="header-dropdown" class="dropdown" style="display:none;">
            <div data-val="normal" title="Normal">Normal</div>
            <div data-val="h1" title="Header 1">H1</div>
            <div data-val="h2" title="Header 2">H2</div>
            <div data-val="h3" title="Header 3">H3</div>
          </div>
        </div>
        <button id="ordered" title="Ordered List">OL</button>
        <button id="unordered" title="Bullet List">UL</button>
        <button id="clear" title="Clear Formatting">Clear</button>
        <button id="table" title="Insert Table">&#x1F5C2;</button>
        <button id="spoiler" title="Insert Spoiler">&#x1F576;</button>
        <button id="undo" title="Undo">Undo</button>
        <button id="redo" title="Redo">Redo</button>
        <button id="link" title="Insert Link">Link</button>
      </div>
      <div id="editor" class="editor" contenteditable="true">${initialContent}</div>
      <script>
        // Send content back to React Native on input.
        function sendContent() {
          window.ReactNativeWebView.postMessage(document.getElementById('editor').innerHTML);
        }
        document.getElementById('editor').addEventListener('input', sendContent);

        // Basic active state toggling (for demonstration; you might need more robust logic).
        function updateActiveState() {
          const sel = window.getSelection();
          if (!sel || sel.rangeCount === 0) return;
          const container = sel.getRangeAt(0).commonAncestorContainer;
          const computed = window.getComputedStyle(container.nodeType === 1 ? container : container.parentElement);
          document.getElementById('bold').classList.toggle('active', computed.fontWeight >= 700);
          document.getElementById('italic').classList.toggle('active', computed.fontStyle === 'italic');
          document.getElementById('underline').classList.toggle('active', computed.textDecorationLine.includes('underline'));
        }
        document.addEventListener('selectionchange', updateActiveState);

        // Toolbar button actions using execCommand (for simplicity)
        document.getElementById('bold').addEventListener('click', () => { document.execCommand('bold'); sendContent(); });
        document.getElementById('italic').addEventListener('click', () => { document.execCommand('italic'); sendContent(); });
        document.getElementById('underline').addEventListener('click', () => { document.execCommand('underline'); sendContent(); });
        document.getElementById('ordered').addEventListener('click', () => { document.execCommand('insertOrderedList'); sendContent(); });
        document.getElementById('unordered').addEventListener('click', () => { document.execCommand('insertUnorderedList'); sendContent(); });
        document.getElementById('clear').addEventListener('click', () => { document.execCommand('removeFormat'); sendContent(); });
        document.getElementById('table').addEventListener('click', () => {
          const rows = prompt('Rows:', '2'), cols = prompt('Cols:', '2');
          let html = '<table border="1" style="border-collapse: collapse; width: 100%;">';
          for(let i=0; i<rows; i++){
            html += '<tr>';
            for(let j=0; j<cols; j++){
              html += '<td>&nbsp;</td>';
            }
            html += '</tr>';
          }
          html += '</table>';
          document.execCommand('insertHTML', false, html);
          sendContent();
        });
        document.getElementById('spoiler').addEventListener('click', () => {
          const sel = window.getSelection();
          if(sel && !sel.isCollapsed){
            const span = document.createElement('spoiler');
            span.className = 'spoiler';
            span.innerText = sel.toString();
            document.execCommand('insertHTML', false, span.outerHTML);
            sendContent();
          } else {
            alert('Select text first.');
          }
        });
        document.getElementById('undo').addEventListener('click', () => { document.execCommand('undo'); sendContent(); });
        document.getElementById('redo').addEventListener('click', () => { document.execCommand('redo'); sendContent(); });
        document.getElementById('link').addEventListener('click', () => {
          const url = prompt('Enter URL:');
          if(!url) return;
          if(window.getSelection().isCollapsed) {
            alert('Select some text to turn into a link.');
            return;
          }
          document.execCommand('createLink', false, url);
          sendContent();
        });
        // Header dropdown logic.
        const headerBtn = document.getElementById('header');
        const headerDropdown = document.getElementById('header-dropdown');
        headerBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          headerDropdown.style.display = headerDropdown.style.display === 'none' ? 'block' : 'none';
        });
        document.querySelectorAll('#header-dropdown div').forEach(div => {
          div.addEventListener('click', function(){
            const val = this.getAttribute('data-val');
            headerBtn.innerHTML = (val === 'normal' ? 'Normal' : val.toUpperCase()) + ' ▼';
            document.execCommand('formatBlock', false, val === 'normal' ? 'P' : val.toUpperCase());
            headerDropdown.style.display = 'none';
            sendContent();
          });
        });
        document.addEventListener('click', () => { headerDropdown.style.display = 'none'; });
      </script>
    </body>
  </html>
  `;
    return (
        <WebView
            originWhitelist={['*']}
            source={{ html: htmlContent }}
            onMessage={(event) => onChange(event.nativeEvent.data)}
            style={{ flex: 1 }}
        />
    );
};
