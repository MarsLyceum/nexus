import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { getRichTextEditorHtml } from './RichTextEditorBase';
import { convertDeltaToMarkdownWithFencesAndFormatting } from '../utils';

interface RichTextEditorWebProps {
    initialContent?: string;
    onChange: (markdown: string) => void;
}

export const RichTextEditorWeb: React.FC<RichTextEditorWebProps> = ({
    initialContent = '',
    onChange,
}) => {
    // Compute srcDoc only once when the component mounts.
    const srcDoc = useMemo(
        () => getRichTextEditorHtml(initialContent),
        [] // removed initialContent dependency to avoid reloading
    );

    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        const messageHandler = (event: MessageEvent) => {
            if (event.data && typeof event.data === 'string') {
                try {
                    const parsed = JSON.parse(event.data);
                    if (parsed.type === 'iframe-init') {
                        console.log(parsed.message);
                        return;
                    }
                    if (parsed.type === 'text-change') {
                        const delta = parsed.delta;
                        const markdown =
                            convertDeltaToMarkdownWithFencesAndFormatting(
                                delta.ops
                            );
                        onChange(markdown);
                        return;
                    }
                } catch (e) {
                    console.error('Failed to parse message:', e);
                }
            }
        };
        window.addEventListener('message', messageHandler);
        return () => window.removeEventListener('message', messageHandler);
    }, [onChange]);

    // For non-web platforms, render a fallback message.
    if (Platform.OS !== 'web') {
        return (
            <View style={styles.container}>
                <Text>Rich text editor is not available on mobile</Text>
            </View>
        );
    }

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
