// components/EmbedPreview.tsx

import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { getDomainFromUrl } from '../utils/linkPreviewUtils';

export type EmbedPreviewProps = {
    url: string;
    previewData: any;
    containerWidth?: number;
};

export const EmbedPreview: React.FC<EmbedPreviewProps> = ({
    url,
    previewData,
    containerWidth,
}) => {
    const domain = getDomainFromUrl(url).toLowerCase();
    const isYouTube =
        domain.includes('youtube.com') || domain.includes('youtu.be');

    if (isYouTube) {
        const defaultWidth = 480;
        const defaultHeight = 270;
        const targetHeight = 360;
        let scaleFactor = targetHeight / defaultHeight;
        let idealWidth = defaultWidth * scaleFactor;
        if (containerWidth && containerWidth < idealWidth) {
            const finalWidth = containerWidth * 0.9;
            scaleFactor = finalWidth / defaultWidth;
            idealWidth = finalWidth;
        }
        const scaledHeight = defaultHeight * scaleFactor;

        if (Platform.OS === 'web') {
            const modifiedEmbedHtml =
                `<style>
          iframe { 
            transform: scale(${scaleFactor});
            transform-origin: top left;
            width: ${defaultWidth}px !important;
            height: ${defaultHeight}px !important;
          }
        </style>` + previewData.embedHtml;
            return (
                <View
                    style={[
                        styles.embedContainer,
                        { width: idealWidth, height: scaledHeight },
                    ]}
                >
                    <div
                        style={{ width: defaultWidth, height: defaultHeight }}
                        dangerouslySetInnerHTML={{ __html: modifiedEmbedHtml }}
                    />
                </View>
            );
        } else {
            const webViewHtml = `
        <html>
          <head>
            <meta name="viewport" content="initial-scale=1.0, width=device-width" />
            <style>
              body, html { margin: 0; padding: 0; background-color: #000; overflow: hidden; }
              iframe { 
                transform: scale(${scaleFactor});
                transform-origin: top left;
                width: ${defaultWidth}px !important;
                height: ${defaultHeight}px !important;
              }
            </style>
          </head>
          <body>
            ${previewData.embedHtml}
          </body>
        </html>
      `;
            return (
                <View
                    style={[
                        styles.embedContainer,
                        { width: idealWidth, height: scaledHeight },
                    ]}
                >
                    <WebView
                        source={{ html: webViewHtml }}
                        style={{ flex: 1 }}
                        allowsInlineMediaPlayback
                    />
                </View>
            );
        }
    } else {
        if (Platform.OS === 'web') {
            return (
                <View style={styles.embedContainer}>
                    <div
                        style={{ width: '100%' }}
                        dangerouslySetInnerHTML={{
                            __html: previewData.embedHtml,
                        }}
                    />
                </View>
            );
        } else {
            const webViewHtml = `
        <html>
          <head>
            <meta name="viewport" content="initial-scale=1.0, width=device-width" />
            <style>
              body, html { margin: 0; padding: 0; background-color: transparent; overflow: hidden; }
              iframe { width: 100%; height: 100%; }
            </style>
          </head>
          <body>
            ${previewData.embedHtml}
          </body>
        </html>
      `;
            return (
                <View style={[styles.embedContainer, { height: 240 }]}>
                    <WebView
                        source={{ html: webViewHtml }}
                        style={{ flex: 1 }}
                        allowsInlineMediaPlayback
                    />
                </View>
            );
        }
    }
};

const styles = StyleSheet.create({
    embedContainer: {
        borderWidth: 0,
        borderColor: '#ccc',
        borderRadius: 8,
        marginVertical: 5,
        overflow: 'hidden',
    },
});
