import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { getRichTextEditorHtml } from './RichTextEditorBase';
import { convertDeltaToMarkdownWithFencesAndFormatting } from '../utils';

interface RichTextEditorMobileProps {
    initialContent?: string;
    onChange: (markdown: string) => void;
}

export const RichTextEditorMobile: React.FC<RichTextEditorMobileProps> = ({
    initialContent = '',
    onChange,
}) => {
    const editorHtml = useMemo(
        () => getRichTextEditorHtml(initialContent),
        [initialContent]
    );

    const handleMessage = (event: any) => {
        const { data } = event.nativeEvent;
        try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'iframe-init') {
                console.log(parsed.message);
                return;
            }
            if (parsed.type === 'text-change') {
                // Convert the raw delta to markdown.
                const delta = parsed.delta;
                const markdown = convertDeltaToMarkdownWithFencesAndFormatting(
                    delta.ops
                );
                console.log('Markdown from WebView:', markdown);
                onChange(markdown);
                return;
            }
        } catch (e) {
            console.error('Failed to parse message from WebView:', e);
        }
    };

    return (
        <View style={styles.outerContainer}>
            <View style={styles.container}>
                <WebView
                    source={{ html: editorHtml }}
                    onMessage={handleMessage}
                    style={styles.webview}
                    javaScriptEnabled
                    domStorageEnabled
                    mixedContentMode="always"
                    onLoadEnd={() => console.log('WebView load end')}
                    onError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        console.warn('WebView error:', nativeEvent);
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
