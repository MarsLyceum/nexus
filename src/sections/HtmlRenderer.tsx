import React from 'react';
import { Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import htmlTruncate from 'html-truncate';
import { decode } from 'html-entities';
import { COLORS } from '../constants';

export type HtmlRendererProps = {
    content: string;
    preview: boolean;
    innerWidth: number;
};

const TRUNCATE_LENGTH = 100;

/**
 * Helper function to fix HTML anchor and pre tags and also spoiler spans:
 * - Prepend "https://" if href does not start with a valid protocol.
 * - Remove target="_blank" and spellcheck="false" attributes.
 * - For spoiler spans (<span class="spoiler">): set initial background and text color
 *   to hide the text and add an onclick handler to toggle the background.
 */
function fixHtmlContent(html: string): string {
    // Prepend https:// to any href not starting with http, https, mailto, or ftp
    let fixed = html.replaceAll(
        /<a\s+([^>]*?)href="(?!https?:\/\/|mailto:|ftp:\/\/)([^"]+)"/gi,
        '<a $1href="https://$2"'
    );
    // Remove target="_blank" attributes
    fixed = fixed.replaceAll(/\s*target="_blank"/gi, '');
    // Remove spellcheck="false" attributes
    fixed = fixed.replaceAll(/\s*spellcheck="false"/gi, '');
    // Process spoilers: add inline style and onclick to toggle background color.
    fixed = fixed.replaceAll(
        '<span class="spoiler"',
        `<span class="spoiler" style="background-color: ${COLORS.White}; color: ${COLORS.White}; cursor: pointer;" onclick="this.style.backgroundColor = (this.style.backgroundColor==='transparent' ? '${COLORS.White}' : 'transparent');"`
    );
    return fixed;
}

export const HtmlRenderer: React.FC<HtmlRendererProps> = ({
    content,
    preview,
    innerWidth,
}) => {
    // State to hold the dynamic height for the WebView (native only)
    const [webViewHeight, setWebViewHeight] = React.useState<number>(0);

    // Decode the raw HTML content.
    const decodedContent = decode(content);
    // Truncate if in preview mode.
    const truncatedContent =
        decodedContent.length > TRUNCATE_LENGTH
            ? htmlTruncate(decodedContent, TRUNCATE_LENGTH, { ellipsis: '...' })
            : decodedContent;
    // Sanitize the content.
    const processedContent = fixHtmlContent(
        preview ? truncatedContent : decodedContent
    );

    // Create the full HTML string for the native WebView.
    // We add a script that calculates the document height and posts it to React Native.
    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { color: ${COLORS.White}; font-size: 14px; margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        ${processedContent}
        <script>
          // Delay execution to ensure content is rendered.
          setTimeout(function() {
            var height = document.documentElement.scrollHeight || document.body.scrollHeight;
            window.ReactNativeWebView.postMessage(height.toString());
          }, 100);
        </script>
      </body>
    </html>
  `;

    // Fallback height until the content height is measured.
    const defaultHeight = preview ? 200 : 300;
    const computedHeight = webViewHeight || defaultHeight;

    return Platform.OS === 'web' ? (
        // Web: remove fixed height so the container sizes to its content.
        <div
            style={{
                width: innerWidth,
                marginBottom: 10,
                backgroundColor: COLORS.PrimaryBackground,
                overflow: 'auto',
                color: COLORS.White,
                fontSize: 14,
                padding: 0,
            }}
            dangerouslySetInnerHTML={{ __html: processedContent }}
        />
    ) : (
        // Native: Use WebView with injected JS to determine dynamic height.
        <WebView
            originWhitelist={['*']}
            source={{ html: htmlContent }}
            injectedJavaScript={`
          setTimeout(function() {
              var height = document.documentElement.scrollHeight || document.body.scrollHeight;
              window.ReactNativeWebView.postMessage(height.toString());
          }, 100);
          true;
      `}
            onMessage={(event) => {
                const height = Number.parseInt(event.nativeEvent.data, 10);
                if (!Number.isNaN(height)) {
                    setWebViewHeight(height);
                }
            }}
            style={{
                width: innerWidth,
                height: computedHeight,
                marginBottom: 10,
                backgroundColor: COLORS.PrimaryBackground,
            }}
            scrollEnabled={false}
            automaticallyAdjustContentInsets
            javaScriptEnabled
        />
    );
};
