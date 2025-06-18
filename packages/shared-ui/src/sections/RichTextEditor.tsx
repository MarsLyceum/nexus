// src/small-components/RichTextEditor.tsx
import React, { useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Platform,
    Pressable,
    NativeSyntheticEvent,
    TextInputContentSizeChangeEventData,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { marked } from 'marked';
import { getRichTextEditorHtml } from './RichTextEditorBase';
import {
    convertDeltaToMarkdownWithFencesAndFormatting,
    getSafeWindow,
} from '../utils';
import { useTheme } from '../theme';

export type RichTextEditorHandle = {
    focus(): void;
};

export type RichTextEditorProps = {
    placeholder?: string;
    initialContent?: string;
    onChange: (markdown: string) => void;
    onFocus?: () => void;
    showToolbar?: boolean;
    showScrollbars?: boolean;
    width?: string;
    height?: string;
    borderRadius?: string;
    backgroundColor?: string;
    updateContent?: number;
    onContentSizeChange?: (
        e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>
    ) => void;
};

export const RichTextEditor = ({
    placeholder = '',
    initialContent = '',
    onChange,
    onFocus,
    showToolbar = true,
    height = '150px',
    width = '100%',
    borderRadius = '20px',
    backgroundColor: backgroundColorProp,
    updateContent = 0,
    showScrollbars = true,
    onContentSizeChange,
}: RichTextEditorProps) => {
    const { theme } = useTheme();
    const isWeb = Platform.OS === 'web';
    const backgroundColor =
        backgroundColorProp ?? theme.colors.PrimaryBackground;
    const lastHeightRef = useRef<number>(0);

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const webviewRef = useRef<WebView>(null);
    console.log('showScrollbars:', showScrollbars);

    // build initial HTML only once
    const initialHtmlRef = useRef(
        getRichTextEditorHtml({
            theme,
            backgroundColor,
            placeholder,
            initialContent,
            showToolbar,
            showScrollbars,
            height,
            width,
            borderRadius,
        })
    );

    // helper to message into iframe or WebView
    const sendMessage = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (msg: Record<string, any>) => {
            const json = JSON.stringify(msg);
            if (isWeb) {
                iframeRef.current?.contentWindow?.postMessage(json, '*');
            } else {
                // inject a window.postMessage so the iframe script picks it up
                webviewRef.current?.injectJavaScript(
                    `window.postMessage(${JSON.stringify(json)}, '*'); true;`
                );
            }
        },
        [isWeb]
    );

    // when any visual prop changes, update editor in-place
    useEffect(() => {
        console.log('updating props:', {
            placeholder,
            showToolbar,
            showScrollbars,
            width,
            height,
            borderRadius,
            backgroundColor,
        });
        sendMessage({
            type: 'update-props',
            props: {
                placeholder,
                showToolbar,
                showScrollbars,
                width,
                height,
                borderRadius,
                backgroundColor,
                theme,
            },
        });
    }, [
        placeholder,
        showToolbar,
        showScrollbars,
        width,
        height,
        borderRadius,
        backgroundColor,
        sendMessage,
        theme,
    ]);

    // when updateContent increments, re-set the content
    useEffect(() => {
        const html = marked(initialContent || '', { gfm: true, breaks: true });
        sendMessage({
            type: 'update-content',
            initialHTML: html,
        });
    }, [updateContent, sendMessage]);

    const handleMessage = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (event: any) => {
            const { data } = event.nativeEvent ?? event;
            try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'focus') {
                    onFocus?.();
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
                if (parsed.type === 'content-height' && onContentSizeChange) {
                    const { height: contentHeight } = parsed;
                    if (
                        contentHeight > 0 &&
                        contentHeight !== lastHeightRef.current
                    ) {
                        lastHeightRef.current = contentHeight;
                        onContentSizeChange({
                            nativeEvent: {
                                contentSize: {
                                    height: contentHeight,
                                    width: Number.parseInt(width, 10),
                                },
                            },
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        } as any);
                    }
                }
            } catch (error) {
                console.error('Failed to parse message from Quill:', error);
            }
        },
        [onChange, onContentSizeChange, onFocus, width]
    );

    // hook up web postMessage listener
    // eslint-disable-next-line consistent-return
    useLayoutEffect(() => {
        const safeWindow = getSafeWindow();
        if (isWeb && safeWindow) {
            safeWindow.addEventListener('message', handleMessage);
            return () =>
                safeWindow.removeEventListener('message', handleMessage);
        }
    }, [handleMessage, isWeb]);

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
                        srcDoc={initialHtmlRef.current}
                        style={webStyles.webEditor}
                        onFocus={onFocus}
                    />
                </div>
            </View>
        );
    }

    // convert px strings to numbers for RN layout
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
            ref={webviewRef}
            source={{ html: initialHtmlRef.current }}
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
        backgroundColor: 'transparent',
    },
});
