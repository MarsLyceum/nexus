// RichTextEditor.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
    createEditor,
    Descendant,
    Transforms,
    Editor,
    Element as SlateElement,
} from 'slate';
import {
    Slate,
    Editable,
    withReact,
    useSlate,
    useSlateStatic,
    ReactEditor,
} from 'slate-react';
import { withHistory } from 'slate-history';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker';
import { COLORS } from '../constants';

// Extend Slate types for our custom elements.
type LinkElement = { type: 'link'; url: string; children: CustomText[] };
type CustomElement =
    | { type: 'paragraph'; children: CustomText[] }
    | { type: 'heading'; level: number; children: CustomText[] }
    | { type: 'numbered-list'; children: CustomElement[] }
    | { type: 'bulleted-list'; children: CustomElement[] }
    | { type: 'list-item'; children: CustomText[] }
    | { type: 'table'; children: TableRowElement[] }
    | { type: 'table-row'; children: TableCellElement[] }
    | { type: 'table-cell'; children: CustomText[] }
    | { type: 'spoiler'; children: CustomText[] }
    | LinkElement;
type TableRowElement = { type: 'table-row'; children: TableCellElement[] };
type TableCellElement = { type: 'table-cell'; children: CustomText[] };
type CustomText = {
    text: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
};

declare module 'slate' {
    interface CustomTypes {
        Editor: ReactEditor;
        Element: CustomElement;
        Text: CustomText;
    }
}

// Fallback Slate value.
const defaultInitialValue: Descendant[] = [
    { type: 'paragraph', children: [{ text: '' }] },
];

interface RichTextEditorProps {
    initialContent?: string;
    onChange: (html: string) => void;
}

const withLinks = (editor: Editor) => {
    const { insertData, insertText, isInline } = editor;
    editor.isInline = (element) =>
        element.type === 'link' ? true : isInline(element);
    editor.insertText = (text) => {
        if (text && text.match(/https?:\/\/\S+/)) {
            wrapLink(editor, text);
        } else {
            insertText(text);
        }
    };
    editor.insertData = (data: DataTransfer) => {
        const text = data.getData('text/plain');
        if (text && text.match(/https?:\/\/\S+/)) {
            wrapLink(editor, text);
        } else {
            insertData(data);
        }
    };
    return editor;
};

const wrapLink = (editor: Editor, url: string) => {
    if (isLinkActive(editor)) {
        unwrapLink(editor);
    }
    const { selection } = editor;
    const link: LinkElement = {
        type: 'link',
        url,
        children: selection
            ? Editor.fragment(editor, selection)
            : [{ text: url }],
    };
    if (selection) {
        Transforms.wrapNodes(editor, link, { split: true, at: selection });
        Transforms.collapse(editor, { edge: 'end' });
    }
};

const unwrapLink = (editor: Editor) => {
    Transforms.unwrapNodes(editor, {
        match: (n) =>
            !Editor.isEditor(n) &&
            SlateElement.isElement(n) &&
            n.type === 'link',
    });
};

const isLinkActive = (editor: Editor) => {
    const [match] = Editor.nodes(editor, {
        match: (n) =>
            !Editor.isEditor(n) &&
            SlateElement.isElement(n) &&
            n.type === 'link',
    });
    return !!match;
};

const sanitizeNodes = (nodes: Descendant[]): Descendant[] =>
    nodes.map((node) => {
        if (!('children' in node) || node.children === undefined) {
            return { ...node, children: [{ text: '' }] };
        }
        if (Array.isArray(node.children)) {
            return { ...node, children: sanitizeNodes(node.children) };
        }
        return node;
    });

// Custom ListItem renders the prefix (bullet or number) and its text.
const ListItem: React.FC<{
    attributes: any;
    children: any;
    element: CustomElement;
}> = ({ attributes, children, element }) => {
    const editor = useSlateStatic();
    let prefix = '• ';
    try {
        const path = ReactEditor.findPath(editor, element);
        const parentEntry = Editor.parent(editor, path);
        if (parentEntry[0].type === 'numbered-list') {
            const index = path[path.length - 1];
            prefix = `${index + 1}. `;
        }
    } catch (error) {
        // Fallback to bullet.
    }
    return (
        <View {...attributes} style={styles.listItem}>
            <Text style={[styles.listItemPrefix, { color: COLORS.MainText }]}>
                {prefix}
            </Text>
            <Text style={[styles.listItemText, { color: COLORS.MainText }]}>
                {children}
            </Text>
        </View>
    );
};

// HeaderDropdown allows selection between paragraph and various heading levels.
const HeaderDropdown: React.FC = () => {
    const editor = useSlate();
    const [selected, setSelected] = useState<string>('paragraph');

    const onValueChange = (itemValue: string) => {
        setSelected(itemValue);
        if (itemValue === 'paragraph') {
            toggleBlock(editor, 'paragraph');
        } else {
            const level = parseInt(itemValue.split('-')[1], 10);
            toggleBlock(editor, 'heading', { level });
        }
        ReactEditor.focus(editor);
    };

    return (
        <View style={styles.dropdown}>
            <Picker
                selectedValue={selected}
                style={{ height: 40, width: 150, color: COLORS.MainText }}
                onValueChange={onValueChange}
                mode="dropdown"
            >
                <Picker.Item label="Paragraph" value="paragraph" />
                <Picker.Item label="Heading 1" value="heading-1" />
                <Picker.Item label="Heading 2" value="heading-2" />
                <Picker.Item label="Heading 3" value="heading-3" />
            </Picker>
        </View>
    );
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    initialContent = '',
    onChange,
}) => {
    console.log('[RichTextEditor] initialContent:', initialContent);
    const initialSlateValue: Descendant[] =
        typeof initialContent === 'string'
            ? [{ type: 'paragraph', children: [{ text: initialContent }] }]
            : defaultInitialValue;
    console.log('[RichTextEditor] initialSlateValue:', initialSlateValue);

    const editor = useMemo(
        () => withLinks(withHistory(withReact(createEditor()))),
        []
    );

    const [value, setValue] = useState<Descendant[]>(initialSlateValue);
    console.log('[RichTextEditor] value state:', value);

    const serialize = (nodes: Descendant[]): string =>
        nodes.map((n) => NodeToHtml(n)).join('');

    const handleChange = (newValue: Descendant[]) => {
        console.log('[RichTextEditor] handleChange newValue:', newValue);
        if (!Array.isArray(newValue)) {
            console.warn(
                '[RichTextEditor] Received non-array newValue:',
                newValue
            );
            return;
        }
        const sanitized = sanitizeNodes(newValue);
        setValue(sanitized);
        onChange(serialize(sanitized));
    };

    const renderElement = useCallback((props: any) => {
        const { element, attributes, children } = props;
        switch (element.type) {
            case 'heading':
                if (element.level === 1)
                    return (
                        <Text
                            {...attributes}
                            style={[styles.h1, { color: COLORS.MainText }]}
                        >
                            {children}
                        </Text>
                    );
                if (element.level === 2)
                    return (
                        <Text
                            {...attributes}
                            style={[styles.h2, { color: COLORS.MainText }]}
                        >
                            {children}
                        </Text>
                    );
                if (element.level === 3)
                    return (
                        <Text
                            {...attributes}
                            style={[styles.h3, { color: COLORS.MainText }]}
                        >
                            {children}
                        </Text>
                    );
                return (
                    <Text {...attributes} style={{ color: COLORS.MainText }}>
                        {children}
                    </Text>
                );
            case 'paragraph':
                // Render paragraphs inside a View to ensure inline leaves are only applied to text.
                return (
                    <View {...attributes} style={styles.paragraph}>
                        {children}
                    </View>
                );
            case 'numbered-list':
                return (
                    <View {...attributes} style={styles.numberedList}>
                        {children}
                    </View>
                );
            case 'bulleted-list':
                return (
                    <View {...attributes} style={styles.bulletedList}>
                        {children}
                    </View>
                );
            case 'list-item':
                return (
                    <ListItem attributes={attributes} element={element}>
                        {children}
                    </ListItem>
                );
            case 'link':
                return (
                    <Text
                        {...attributes}
                        style={{ color: COLORS.Primary }}
                        onPress={() => {}}
                    >
                        {children}
                    </Text>
                );
            case 'table':
                return (
                    <View {...attributes} style={styles.table}>
                        {children}
                    </View>
                );
            case 'table-row':
                return (
                    <View {...attributes} style={styles.tableRow}>
                        {children}
                    </View>
                );
            case 'table-cell':
                return (
                    <View {...attributes} style={styles.tableCell}>
                        {children}
                    </View>
                );
            case 'spoiler':
                return (
                    <Text
                        {...attributes}
                        style={[styles.spoiler, { color: COLORS.MainText }]}
                        onPress={() => {}}
                    >
                        {children}
                    </Text>
                );
            default:
                return (
                    <Text {...attributes} style={{ color: COLORS.MainText }}>
                        {children}
                    </Text>
                );
        }
    }, []);

    const renderLeaf = useCallback((props: any) => {
        const { children, leaf } = props;
        const textStyle: any = {
            color: COLORS.MainText,
            textAlign: 'left',
            lineHeight: 24,
            // Ensure the text is aligned at the top.
            textAlignVertical: 'top',
        };
        if (leaf.bold) textStyle.fontWeight = 'bold';
        if (leaf.italic) textStyle.fontStyle = 'italic';
        if (leaf.underline) textStyle.textDecorationLine = 'underline';
        return (
            <Text {...props.attributes} style={textStyle}>
                {children}
            </Text>
        );
    }, []);

    // Flatten style for the Editable component.
    const editableStyle = StyleSheet.flatten([
        styles.editable,
        { color: COLORS.MainText, backgroundColor: COLORS.PrimaryBackground },
    ]);

    return (
        <Slate
            editor={editor}
            value={value}
            onChange={handleChange}
            initialValue={defaultInitialValue}
        >
            <Toolbar />
            <Editable
                renderElement={renderElement}
                renderLeaf={renderLeaf}
                placeholder="Enter some rich text…"
                spellCheck
                autoFocus
                style={editableStyle}
            />
        </Slate>
    );
};

const Toolbar = () => {
    return (
        <View style={styles.toolbar}>
            <MarkButton
                format="bold"
                icon={
                    <MaterialCommunityIcons
                        name="format-bold"
                        size={20}
                        color={COLORS.MainText}
                    />
                }
                title="Bold"
            />
            <MarkButton
                format="italic"
                icon={
                    <MaterialCommunityIcons
                        name="format-italic"
                        size={20}
                        color={COLORS.MainText}
                    />
                }
                title="Italic"
            />
            <MarkButton
                format="underline"
                icon={
                    <MaterialCommunityIcons
                        name="format-underline"
                        size={20}
                        color={COLORS.MainText}
                    />
                }
                title="Underline"
            />
            <HeaderDropdown />
            <BlockButton
                format="numbered-list"
                icon={
                    <MaterialCommunityIcons
                        name="format-list-numbered"
                        size={20}
                        color={COLORS.MainText}
                    />
                }
                title="Numbered List"
            />
            <BlockButton
                format="bulleted-list"
                icon={
                    <MaterialCommunityIcons
                        name="format-list-bulleted"
                        size={20}
                        color={COLORS.MainText}
                    />
                }
                title="Bullet List"
            />
            <LinkButton />
            <InsertTableButton />
            <InsertSpoilerButton />
            <UndoButton />
            <RedoButton />
        </View>
    );
};

type MarkButtonProps = {
    format: 'bold' | 'italic' | 'underline';
    icon: React.ReactNode;
    title: string;
};

const MarkButton: React.FC<MarkButtonProps> = ({ format, icon, title }) => {
    const editor = useSlate();
    const isActive = Editor.marks(editor)?.[format] === true;
    return (
        <TouchableOpacity
            onPress={() => {
                if (isActive) Editor.removeMark(editor, format);
                else Editor.addMark(editor, format, true);
                ReactEditor.focus(editor);
            }}
            style={styles.button}
            title={title}
        >
            {icon}
        </TouchableOpacity>
    );
};

type BlockButtonProps = {
    format: 'heading' | 'numbered-list' | 'bulleted-list';
    level?: number;
    icon: React.ReactNode;
    title: string;
};

const BlockButton: React.FC<BlockButtonProps> = ({
    format,
    level,
    icon,
    title,
}) => {
    const editor = useSlate();
    const isActive = (() => {
        const [match] = Editor.nodes(editor, {
            match: (n) =>
                !Editor.isEditor(n) &&
                SlateElement.isElement(n) &&
                n.type === format &&
                (level ? n.level === level : true),
        });
        return !!match;
    })();
    return (
        <TouchableOpacity
            onPress={() => {
                toggleBlock(editor, format, level ? { level } : {});
                ReactEditor.focus(editor);
            }}
            style={styles.button}
            title={title}
        >
            {icon}
        </TouchableOpacity>
    );
};

const LinkButton = () => {
    const editor = useSlate();
    return (
        <TouchableOpacity
            onPress={() => {
                const url = prompt('Enter the URL:');
                if (!url) return;
                wrapLink(editor, url);
                ReactEditor.focus(editor);
            }}
            style={styles.button}
            title="Insert Link"
        >
            <MaterialCommunityIcons
                name="link"
                size={20}
                color={isLinkActive(editor) ? COLORS.Primary : COLORS.MainText}
            />
        </TouchableOpacity>
    );
};

type InsertButtonProps = {
    onClick: () => void;
    icon: React.ReactNode;
    title: string;
};

const InsertButton: React.FC<InsertButtonProps> = ({
    onClick,
    icon,
    title,
}) => {
    return (
        <TouchableOpacity onPress={onClick} style={styles.button} title={title}>
            {icon}
        </TouchableOpacity>
    );
};

const UndoButton = () => {
    const editor = useSlate();
    return (
        <TouchableOpacity
            onPress={() => {
                editor.undo();
                ReactEditor.focus(editor);
            }}
            style={styles.button}
            title="Undo"
        >
            <MaterialCommunityIcons
                name="undo"
                size={20}
                color={COLORS.MainText}
            />
        </TouchableOpacity>
    );
};

const RedoButton = () => {
    const editor = useSlate();
    return (
        <TouchableOpacity
            onPress={() => {
                editor.redo();
                ReactEditor.focus(editor);
            }}
            style={styles.button}
            title="Redo"
        >
            <MaterialCommunityIcons
                name="redo"
                size={20}
                color={COLORS.MainText}
            />
        </TouchableOpacity>
    );
};

const InsertTableButton = () => {
    const editor = useSlate();
    const tableNode = {
        type: 'table',
        children: [
            {
                type: 'table-row',
                children: [
                    {
                        type: 'table-cell',
                        children: [{ text: 'Cell content' }],
                    },
                ],
            },
        ],
    };
    return (
        <InsertButton
            onClick={() => {
                Transforms.insertNodes(editor, tableNode);
                Transforms.insertNodes(editor, {
                    type: 'paragraph',
                    children: [{ text: '' }],
                });
                ReactEditor.focus(editor);
            }}
            icon={
                <MaterialCommunityIcons
                    name="table"
                    size={20}
                    color={COLORS.MainText}
                />
            }
            title="Insert Table"
        />
    );
};

const InsertSpoilerButton = () => {
    const editor = useSlate();
    const spoilerNode = {
        type: 'spoiler',
        children: [{ text: 'Spoiler content' }],
    };
    return (
        <InsertButton
            onClick={() => {
                Transforms.insertNodes(editor, spoilerNode);
                ReactEditor.focus(editor);
            }}
            icon={
                <MaterialCommunityIcons
                    name="eye-off"
                    size={20}
                    color={COLORS.MainText}
                />
            }
            title="Insert Spoiler"
        />
    );
};

const toggleBlock = (editor: Editor, format: string, options: any = {}) => {
    const isActive = (() => {
        const [match] = Editor.nodes(editor, {
            match: (n) =>
                !Editor.isEditor(n) &&
                SlateElement.isElement(n) &&
                n.type === format &&
                (options.level ? n.level === options.level : true),
        });
        return !!match;
    })();
    Transforms.unwrapNodes(editor, {
        match: (n) =>
            !Editor.isEditor(n) &&
            SlateElement.isElement(n) &&
            (n.type === 'numbered-list' || n.type === 'bulleted-list'),
        split: true,
    });
    const newType = isActive ? 'paragraph' : format;
    Transforms.setNodes(editor, { type: newType, ...options });
    if (
        !isActive &&
        (format === 'numbered-list' || format === 'bulleted-list')
    ) {
        const block = { type: format, children: [] };
        Transforms.wrapNodes(editor, block);
    }
};

const NodeToHtml = (node: Descendant): string => {
    if (Editor.isEditor(node)) return '';
    if (!node) return '';
    if (!('text' in node)) {
        const children = node.children.map((n) => NodeToHtml(n)).join('');
        switch (node.type) {
            case 'heading':
                return `<h${node.level}>${children}</h${node.level}>`;
            case 'numbered-list':
                return `<ol>${children}</ol>`;
            case 'bulleted-list':
                return `<ul>${children}</ul>`;
            case 'list-item':
                return `<li>${children}</li>`;
            case 'link':
                return `<a href="${(node as LinkElement).url}">${children}</a>`;
            case 'table':
                return `<table style="border-collapse: collapse; width: 100%;" border="1">${children}</table>`;
            case 'table-row':
                return `<tr>${children}</tr>`;
            case 'table-cell':
                return `<td style="border: 1px solid; padding: 4px;">${children}</td>`;
            case 'spoiler':
                return `<div class="spoiler">${children}</div>`;
            default:
                return `<p>${children}</p>`;
        }
    } else {
        let text = node.text;
        if (node.bold) text = `<strong>${text}</strong>`;
        if (node.italic) text = `<em>${text}</em>`;
        if (node.underline) text = `<u>${text}</u>`;
        return text;
    }
};

const styles = StyleSheet.create({
    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.TextInput,
        padding: 8,
    },
    button: {
        marginLeft: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 16,
        color: COLORS.MainText,
    },
    dropdown: {
        marginLeft: 8,
        borderWidth: 1,
        borderColor: COLORS.InactiveText,
        borderRadius: 5,
        overflow: 'hidden',
    },
    bulletedList: {
        paddingLeft: 10,
    },
    numberedList: {
        paddingLeft: 10,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    listItemPrefix: {
        marginRight: 5,
    },
    listItemText: {
        flex: 1,
    },
    paragraph: {
        marginVertical: 4,
        minHeight: 24,
    },
    h1: {
        fontSize: 32,
        fontWeight: 'bold',
        marginVertical: 8,
    },
    h2: {
        fontSize: 28,
        fontWeight: 'bold',
        marginVertical: 8,
    },
    h3: {
        fontSize: 24,
        fontWeight: 'bold',
        marginVertical: 8,
    },
    table: {
        borderWidth: 1,
        borderColor: '#000',
        marginVertical: 8,
    },
    tableRow: {
        flexDirection: 'row',
    },
    tableCell: {
        borderWidth: 1,
        borderColor: '#000',
        padding: 4,
        flex: 1,
    },
    spoiler: {
        backgroundColor: '#333',
    },
    editable: {
        padding: 10,
        height: 200, // Fixed height for the editor
        textAlign: 'left',
        lineHeight: 24,
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        // textAlignVertical works on Android; on web, ensure the container is styled correctly.
        textAlignVertical: 'top',
    },
});
