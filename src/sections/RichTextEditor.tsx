// RichTextEditor.tsx
import React from 'react';
import { Platform } from 'react-native';
import { RichTextEditorWeb } from './RichTextEditorWeb';
import { RichTextEditorMobile } from './RichTextEditorMobile_WebView';

interface RichTextEditorProps {
    initialContent?: string;
    onChange: (html: string) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = (props) => {
    if (Platform.OS === 'web') {
        return <RichTextEditorWeb {...props} />;
    }
    return <RichTextEditorMobile {...props} />;
};
