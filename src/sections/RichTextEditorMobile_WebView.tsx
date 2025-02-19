import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS } from '../constants'; // Import your color constants

interface RichTextEditorMobileProps {
    initialContent?: string;
    onChange: (html: string) => void;
}

export const RichTextEditorMobile: React.FC<RichTextEditorMobileProps> = ({
    initialContent = '',
    onChange,
}) => {
    // Memoize the HTML so it is created only once and not on every re-render.
    const editorHtml = React.useMemo(() => {
        return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <!-- Allow inline scripts/styles and eval for debugging -->
        <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval';">
        <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
        <style>
          /* Ensure borders and paddings are included in the width calculations */
          * {
            box-sizing: border-box;
          }
          /* Allow the toolbar to display fully */
          .ql-toolbar.ql-snow {
            width: 100%;
            overflow: visible;
          }
          /* Reset and full size */
          body, html {
            margin: 0;
            padding: 0;
            height: 100%;
            width: 100%;
            background-color: ${COLORS.PrimaryBackground};
          }
          /* Editor container */
          #editor {
            height: 100%;
            width: 100%;
          }
          /* Toolbar and Editor Styles (matching the web version) */
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
        </style>
      </head>
      <body>
        <div id="editor"></div>
        <!-- Load Quill from CDN -->
        <script src="https://cdn.quilljs.com/1.3.6/quill.js"></script>
        <script>
          var initialContent = ${JSON.stringify(initialContent)};
          window.addEventListener('load', function() {
              var options = {
                  theme: 'snow',
                  modules: {
                      toolbar: [
                        ['bold', 'italic', 'underline'],
                        [{ header: [1, 2, 3, false] }],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['link'],
                        ['clean']
                      ]
                  }
              };
              var quill = new Quill('#editor', options);
              // Set the initial content
              quill.clipboard.dangerouslyPasteHTML(initialContent);
              // Listen for text changes and post updated HTML to React Native
              quill.on('text-change', function(delta, oldDelta, source) {
                  var html = document.querySelector('#editor .ql-editor').innerHTML;
                  if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                      window.ReactNativeWebView.postMessage(html);
                  }
              });
          });
        </script>
      </body>
    </html>
        `;
    }, []); // Empty dependency array ensures this is computed only once

    return (
        <View style={styles.outerContainer}>
            <View style={styles.container}>
                <WebView
                    source={{ html: editorHtml }}
                    onMessage={(event) => onChange(event.nativeEvent.data)}
                    style={styles.webview}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    mixedContentMode="always"
                    onLoadEnd={() => console.log('WebView load end')}
                    onError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        console.warn('WebView error: ', nativeEvent);
                    }}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        width: '100%',
        height: 350,
    },
    container: {
        flex: 1,
    },
    webview: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
