import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import { WebView } from 'react-native-webview';
import { getRichTextEditorHtml } from './RichTextEditorBase';
import { convertDeltaToMarkdownWithFencesAndFormatting } from '../utils';
import { COLORS } from '../constants';

export const RichTextEditor: React.FC<{
    placeholder?: string;
    initialContent?: string;
    onChange: (markdown: string) => void;
    onFocus?: () => void;
    showToolbar?: boolean;
    width?: string;
    height?: string;
    borderRadius?: string; // <-- new prop for border radius
    backgroundColor?: string; // <-- new prop for editor background color
    updateContent?: number;
}> = ({
    placeholder = '',
    initialContent = '',
    onChange,
    onFocus,
    showToolbar = true,
    height = '150px',
    width = '100%',
    borderRadius = '20px', // <-- default value
    backgroundColor = COLORS.PrimaryBackground,
    updateContent = false,
}) => {
    const isWeb = Platform.OS === 'web';

    const webSrcDoc = useMemo(
        () =>
            getRichTextEditorHtml(
                placeholder,
                initialContent,
                showToolbar,
                height,
                width,
                borderRadius, // pass custom border radius
                backgroundColor // pass custom background color
            ),
        [
            placeholder,
            showToolbar,
            height,
            width,
            borderRadius,
            backgroundColor,
            updateContent,
        ]
    );

    const mobileHtml = useMemo(
        () =>
            getRichTextEditorHtml(
                placeholder,
                initialContent,
                showToolbar,
                height,
                width,
                borderRadius, // pass custom border radius
                backgroundColor // pass custom background color
            ),
        [placeholder, showToolbar, height, width, borderRadius, backgroundColor]
    );

    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (!isWeb) return;
        const messageHandler = (event: MessageEvent) => {
            if (event.data && typeof event.data === 'string') {
                try {
                    const parsed = JSON.parse(event.data);
                    if (parsed.type === 'iframe-init') {
                        console.log(parsed.message);
                        return;
                    }
                    if (parsed.type === 'focus') {
                        if (onFocus) onFocus();
                        return;
                    }
                    if (parsed.type === 'text-change') {
                        const { delta } = parsed;
                        const markdown =
                            convertDeltaToMarkdownWithFencesAndFormatting(
                                delta.ops
                            );
                        onChange(markdown);
                    }
                } catch (error) {
                    console.error('Failed to parse message:', error);
                }
            }
        };
        window.addEventListener('message', messageHandler);
        return () => window.removeEventListener('message', messageHandler);
    }, [isWeb, onChange, onFocus]);

    const handleMessage = (event: any) => {
        const { data } = event.nativeEvent;
        try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'iframe-init') {
                console.log(parsed.message);
                return;
            }
            if (parsed.type === 'text-change') {
                const { delta } = parsed;
                const markdown = convertDeltaToMarkdownWithFencesAndFormatting(
                    delta.ops
                );
                onChange(markdown);
            }
        } catch (error) {
            console.error('Failed to parse message from WebView:', error);
        }
    };

    if (isWeb) {
        return (
            <View style={[webStyles.container, { width, height }]}>
                <style>{`
                    .my-editor-iframe {
                        width: 100% !important;
                        height: 100% !important;
                        transform: none !important;
                        background-color: transparent !important;
                    }
                `}</style>
                <div style={webStyles.flexWrapper}>
                    <iframe
                        ref={iframeRef}
                        className="my-editor-iframe"
                        title="Rich Text Editor Iframe"
                        srcDoc={webSrcDoc}
                        style={webStyles.webEditor}
                        onFocus={onFocus}
                    />
                </div>
            </View>
        );
    }

    // For mobile, convert width and height if provided as "px"
    let containerWidth: string | number = width;
    if (typeof width === 'string' && width.endsWith('px')) {
        containerWidth = Number.parseInt(width, 10);
    }
    let containerHeight: string | number = height;
    if (typeof height === 'string' && height.endsWith('px')) {
        containerHeight = Number.parseInt(height, 10);
    }

    const webViewComponent = (
        <WebView
            source={{ html: mobileHtml }}
            onMessage={handleMessage}
            style={mobileStyles.webview}
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
            onLoadEnd={() => console.log('WebView load end')}
            onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.warn('WebView error:', nativeEvent);
            }}
        />
    );

    return (
        <View
            style={[
                mobileStyles.outerContainer,
                { width: containerWidth, height: containerHeight },
            ]}
        >
            <View style={mobileStyles.container}>
                {onFocus ? (
                    <Pressable onPress={onFocus} style={{ flex: 1 }}>
                        {webViewComponent}
                    </Pressable>
                ) : (
                    webViewComponent
                )}
            </View>
        </View>
    );
};

const webStyles = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'transparent',
    },
    flexWrapper: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent',
    },
    webEditor: {
        flex: 1,
        width: '100%',
        height: '100%',
        // @ts-expect-error: web-only type for border styling
        border: 'none',
        backgroundColor: 'transparent',
    },
});

const mobileStyles = StyleSheet.create({
    outerContainer: {
        width: '100%',
        height: 350,
        backgroundColor: 'transparent',
    },
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    webview: {
        flex: 1,
        backgroundColor: 'transparent', // <-- Changed from '#fff'
    },
});
