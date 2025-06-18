/* eslint-disable max-lines */
// RichTextEditorBase.tsx
import { marked } from 'marked';

import { Theme } from '../theme';

const html = String.raw as (
    strings: TemplateStringsArray,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...interpolations: any[]
) => string;

// --- Custom Marked Extension for Spoilers ---
const spoilerExtension = {
    name: 'spoiler',
    level: 'inline',
    start(src: string) {
        const discordIndex = src.indexOf('||');
        const redditIndex = src.indexOf('>!');
        if (discordIndex === -1) return redditIndex;
        if (redditIndex === -1) return redditIndex;
        return Math.min(discordIndex, redditIndex);
    },
    // eslint-disable-next-line consistent-return
    tokenizer(src: string) {
        const cleaned = src.replaceAll(/[\u200B-\u200D\uFEFF]/g, '');
        if (cleaned.startsWith('||')) {
            const match = /^\|\|([^\n|]+(?:\|(?!\|)[^\n|]+)*)\|\|(?=$|\n)/.exec(
                cleaned
            );
            if (match) {
                return {
                    type: 'spoiler',
                    raw: match[0],
                    text: match[1].trim(),
                };
            }
        }
        if (src.startsWith('>!')) {
            const match = /^>!([^!]+(?:!(?!<)[^!]+)*)!</.exec(src);
            if (match) {
                return {
                    type: 'spoiler',
                    raw: match[0],
                    text: match[1].trim(),
                };
            }
        }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderer(token: any) {
        return `<span class="spoiler">${token.text}</span>`;
    },
};

marked.use({ extensions: [spoilerExtension] });

export type GetRichTextEditorHtmlProps = {
    theme: Theme;
    backgroundColor?: string;
    placeholder?: string;
    initialContent?: string;
    showToolbar?: boolean;
    showScrollbars?: boolean;
    height?: string;
    width?: string;
    borderRadius?: string;
};

export function getRichTextEditorHtml({
    theme,
    backgroundColor: backgroundColorProp,
    placeholder = 'Start typing...',
    initialContent = '',
    showToolbar = true,
    showScrollbars = true,
    height = '80vh',
    width = '100%',
    borderRadius = '5px',
}: GetRichTextEditorHtmlProps): string {
    const backgroundColor =
        backgroundColorProp ?? theme.colors.SecondaryBackground;
    const autoMode = height === 'auto' || height === '0px' || height === '0';

    const cssHeight = autoMode ? 'auto' : height;
    const editorWidth = width;
    const initialHTML = initialContent ? marked(initialContent) : '<p><br></p>';

    // Build CSS variable declarations from theme.colors
    const colorVars = Object.entries(theme.colors)
        .map(([key, value]) => `--${key}: ${value};`)
        .join('\n                        ');

    return html`<!doctype html>
        <html>
            <head>
                <meta charset="utf-8" />
                <meta
                    name="viewport"
                    content="width=${editorWidth}, initial-scale=1"
                />
                <title>Quill Editor Iframe</title>
                <!-- Quill CSS -->
                <link
                    href="https://cdn.quilljs.com/1.3.6/quill.snow.css"
                    rel="stylesheet"
                />
                <!-- Roboto 400 -->
                <link
                    href="https://fonts.googleapis.com/css2?family=Roboto:wght@400&display=swap"
                    rel="stylesheet"
                />
                <style>
                    /* drive ALL props via CSS variables */
                    :root {
                        ${colorVars}
                        --editor-height: ${cssHeight};
                        --editor-width: ${editorWidth};
                        --editor-bg-color: ${backgroundColor};
                        --editor-border-radius: ${borderRadius};
                        --editor-border-color: var(--ActiveText);
                        --editor-overflow: ${showScrollbars
                        ? 'auto'
                        : 'hidden'};
                        --scrollbar-width: ${showScrollbars
                        ? '8px'
                        : '0'};   /* IE / Firefox keyword */
                        --scrollbar-display: ${showScrollbars
                        ? 'block'
                        : 'none'}; /* WebKit keyword */
                        --editor-toolbar-display: ${showToolbar
                        ? 'block'
                        : 'none'};
                        --editor-toolbar-height: ${showToolbar
                        ? '40px'
                        : '0px'};
                    }

                    html,
                    body {
                        margin: 0;
                        padding: 0;
                        width: var(--editor-width) !important;
                        font-family: 'Roboto', sans-serif !important;
                        font-size: 14px !important;
                        /* overflow: var(--editor-overflow) !important; */
                        overflow: hidden
                    }

                    /* Overflow logic lives on both container & editor */
                    .ql-container,
                    /* .ql-editor */
                     {
                        overflow-y: var(--editor-overflow) !important;
                    }

                    /* hide / show native scrollbars */
                    .ql-editor {
                        -ms-overflow-style: var(
                            --scrollbar-width
                        ) !important; /* IE / Edge Legacy */
                        scrollbar-width: var(
                            --scrollbar-width
                        ) !important; /* Firefox */
                    }
                    .ql-editor::-webkit-scrollbar {
                        /* display: var(
                            --scrollbar-display
                        ) !important; Chrome / Safari */
                        width: var(--scrollbar-width) !important;                /* 0 ⇒ invisible */
                        height: var(--scrollbar-width) !important;
                    }
                    .ql-editor::-webkit-scrollbar-track {
                        background: var(--PrimaryBackground);   /* rail colour */
                    }

                    .ql-editor::-webkit-scrollbar-thumb {
                        background: var(--TextInput);           /* thumb colour */
                        border-radius: 999px;                   /* fully-rounded ends */
                    }

                    .ql-editor {
                        scrollbar-width: thin;                                    /* “auto”, “thin”, or “none” */
                        scrollbar-color: var(--TextInput) var(--PrimaryBackground);  /* thumb   track */
                    }

                    .quill-wrapper {
                        border: 1px solid transparent;
                        border-radius: var(--editor-border-radius) !important;
                        width: var(--editor-width);
                        height: var(--editor-height);
                        background-color: var(--editor-bg-color) !important;
                        /* overflow: var(--editor-overflow) !important; */
                        overflow: hidden;
                        box-sizing: border-box;
                        transition: border-color 0.15s ease;
                    }
                    .quill-wrapper:focus-within,
                    .quill-wrapper.focused {
                        border: 1px solid var(--editor-border-color) !important;
                    }

                    #toolbar-placeholder {
                    }

                    #editor {
                        width: 100%;
                        height: calc(
                            var(--editor-height) - var(--editor-toolbar-height)
                        ) !important;
                    }

                    /* Remove Quill’s default borders so the wrapper border is continuous */
                    .ql-container,
                    .ql-container.ql-snow {
                        /* height: var(--editor-height); */
                        height: 100%;
                        border: none !important;
                        /* overflow: var(--editor-overflow) !important; */
                    }

                    .ql-toolbar {
                        display: var(--editor-toolbar-display) !important;
                        border: none !important;
                        border-top-left-radius: var(
                            --editor-border-radius
                        ) !important;
                        border-top-right-radius: var(
                            --editor-border-radius
                        ) !important;
                        background-color: var(--editor-bg-color) !important;
                    }

                    .ql-container.ql-snow {
                        border-bottom-left-radius: var(
                            --editor-border-radius
                        ) !important;
                        border-bottom-right-radius: var(
                            --editor-border-radius
                        ) !important;
                        background-color: var(--editor-bg-color) !important;
                    }

                    .ql-editor {
                        padding: 10px !important;
                        box-sizing: border-box;
                        color: var(--MainText) !important;
                        font-family: 'Roboto', sans-serif !important;
                        font-size: 14px !important;
                        height: 100% !important;
                        overflow: var(--editor-overflow) !important;
                    }

                    .ql-editor.ql-blank::before {
                        color: var(--MainText) !important;
                        font-style: normal !important;
                    }

                    .ql-toolbar button {
                        color: var(--MainText) !important;
                    }

                    .ql-toolbar button svg {
                        stroke: var(--MainText) !important;
                        fill: var(--MainText) !important;
                    }

                    .ql-stroke {
                        stroke: var(--MainText) !important;
                    }

                    .ql-fill {
                        fill: var(--MainText) !important;
                    }

                    .ql-toolbar button:hover svg,
                    .ql-toolbar button.ql-active svg {
                        stroke: var(--Secondary) !important;
                        fill: var(--Secondary) !important;
                    }

                    .ql-toolbar button:hover .ql-stroke,
                    .ql-toolbar button.ql-active .ql-stroke {
                        stroke: var(--Secondary) !important;
                    }

                    .ql-toolbar button:hover .ql-fill,
                    .ql-toolbar button.ql-active .ql-fill {
                        fill: var(--Secondary) !important;
                    }

                    .ql-toolbar .ql-picker-label,
                    .ql-toolbar .ql-picker-item {
                        color: var(--MainText) !important;
                    }

                    .ql-toolbar .ql-picker-label:hover,
                    .ql-toolbar .ql-picker-item:hover,
                    .ql-toolbar .ql-picker-label.ql-active,
                    .ql-toolbar .ql-picker-item.ql-selected {
                        color: var(--Secondary) !important;
                    }

                    .ql-picker-options {
                        background-color: var(--AppBackground) !important;
                    }

                    .ql-tooltip {
                        background-color: var(--editor-bg-color) !important;
                        border: 1px solid var(--TextInput) !important;
                        color: var(--MainText) !important;
                        border-radius: 5px !important;
                        transform: translate(10%, 10%) !important;
                        z-index: 1000;
                    }

                    .ql-tooltip input {
                        background-color: var(--SecondaryBackground) !important;
                        color: var(--MainText) !important;
                        border: 1px solid var(--TextInput) !important;
                        border-radius: 3px !important;
                        padding: 5px;
                    }

                    .ql-tooltip .ql-action {
                        color: var(--Secondary) !important;
                    }

                    .spoiler {
                        background-color: var(--InactiveText) !important;
                        color: var(--ActiveText) !important;
                        border-radius: 3px;
                        padding: 2px 6px;
                    }

                    .ql-editor table,
                    .ql-editor table th,
                    .ql-editor table td {
                        border: 1px solid var(--ActiveText) !important;
                    }

                    .custom-bullet {
                        display: inline-block;
                        width: 1em;
                        margin-right: 0.2em;
                        color: var(--Secondary) !important;
                    }

                    .ql-toolbar button svg.ql-spoiler-icon line {
                        stroke: currentColor !important;
                    }

                    .ql-toolbar button:hover svg.ql-spoiler-icon line,
                    .ql-toolbar button.ql-active svg.ql-spoiler-icon line {
                        stroke: var(--Secondary) !important;
                    }

                    .ql-toolbar button:hover svg.ql-spoiler-icon,
                    .ql-toolbar button.ql-active svg.ql-spoiler-icon {
                        color: var(--Secondary) !important;
                    }
                </style>
            </head>
            <body>
                <div class="quill-wrapper">
                    <div id="toolbar-placeholder"></div>
                    <div id="editor"></div>
                </div>
                <script src="https://cdn.quilljs.com/1.3.6/quill.js"></script>
                <script>
                    function initQuill() {
                        var CodeBlock = Quill.import('formats/code-block');
                        CodeBlock.create = function () {
                            var node = document.createElement('pre');
                            node.setAttribute('spellcheck', 'false');
                            node.classList.add('ql-syntax');
                            return node;
                        };
                        Quill.register(CodeBlock, true);

                        var Inline = Quill.import('blots/inline');
                        class SpoilerBlot extends Inline {
                            static create() {
                                var node = super.create();
                                node.setAttribute('class', 'spoiler');
                                return node;
                            }
                            static formats(node) {
                                return node.getAttribute('class') === 'spoiler';
                            }
                            static value(node) {
                                return node.innerText;
                            }
                        }
                        SpoilerBlot.blotName = 'spoiler';
                        SpoilerBlot.tagName = 'span';
                        Quill.register(SpoilerBlot);

                        var icons = Quill.import('ui/icons');
                        icons['spoiler'] =
                            '<svg class="ql-spoiler-icon" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M12 4.5c-4.97 0-9.27 3.11-11 7.5 1.73 4.39 6.03 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6.03-7.50-11-7.5zm0 13c-3.31 0-6-2.69-6-6 0-.89.22-1.73.61-2.46l8.85 8.85C13.73 17.78 12.89 18 12 18zm4.39-2.03l-8.85-8.85c.73-.39 1.57-.61 2.46-.61 3.31 0 6 2.69 6 6 0 .89-.22 1.73-.61 2.46z"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2"/></svg>';

                        var toolbarHandlers = {
                            spoiler: function () {
                                var range = this.quill.getSelection();
                                if (!range) return;
                                var currentFormat = this.quill.getFormat(range);
                                if (range.length > 0) {
                                    var isActive = !!currentFormat.spoiler;
                                    this.quill.formatText(
                                        range.index,
                                        range.length,
                                        'spoiler',
                                        !isActive
                                    );
                                } else {
                                    this.quill.format(
                                        'spoiler',
                                        !currentFormat.spoiler
                                    );
                                }
                            },
                            bullet: function () {
                                var range = this.quill.getSelection();
                                if (!range) return;
                                var currentFormat = this.quill.getFormat(range);
                                var isActive = currentFormat.list === 'bullet';
                                this.quill.format(
                                    'list',
                                    isActive ? false : 'bullet'
                                );
                            },
                        };

                        var quillOptions = {
                            theme: 'snow',
                            modules: {
                                toolbar: {
                                    container: [
                                        [
                                            'bold',
                                            'italic',
                                            'underline',
                                            'strike',
                                        ],
                                        [{ header: [1, 2, 3, false] }],
                                        [
                                            { list: 'ordered' },
                                            { list: 'bullet' },
                                        ],
                                        [
                                            'link',
                                            'spoiler',
                                            'blockquote',
                                            'code-block',
                                        ],
                                        ['clean'],
                                    ],
                                    handlers: toolbarHandlers,
                                },
                            },
                            placeholder: '${placeholder}',
                        };

                        var quill = new Quill('#editor', quillOptions);
                        window.quill = quill;

                        setTimeout(() => {
                            const root = quill.root;
                            const wrapper =
                                document.querySelector('.quill-wrapper');
                            if (!root || !wrapper) return;

                            root.addEventListener('focus', () =>
                                wrapper.classList.add('focused')
                            );
                            root.addEventListener('blur', () =>
                                wrapper.classList.remove('focused')
                            );

                            if (document.activeElement === root)
                                wrapper.classList.add('focused');
                        }, 0);

                        const generatedToolbar =
                            quill.container.parentNode.querySelector(
                                '.ql-toolbar'
                            );
                        const toolbarPlaceholder = document.getElementById(
                            'toolbar-placeholder'
                        );
                        if (generatedToolbar && toolbarPlaceholder) {
                            toolbarPlaceholder.appendChild(generatedToolbar);
                        }

                        // message listener
                        window.addEventListener('message', (e) => {
                            try {
                                const msg = JSON.parse(e.data);
                                switch (msg.type) {
                                    case 'update-content':
                                        if (msg.initialHTML !== undefined) {
                                            const delta =
                                                quill.clipboard.convert(
                                                    msg.initialHTML
                                                );
                                            quill.setContents(delta, 'silent');
                                        }
                                        break;
                                    case 'update-props':
                                        const props = msg.props;
                                        if (props.height !== undefined) {
                                            document.documentElement.style.setProperty(
                                                '--editor-height',
                                                props.height
                                            );
                                        }
                                        if (props.width !== undefined) {
                                            document.documentElement.style.setProperty(
                                                '--editor-width',
                                                props.width
                                            );
                                        }
                                        if (
                                            props.backgroundColor !== undefined
                                        ) {
                                            document.documentElement.style.setProperty(
                                                '--editor-bg-color',
                                                props.backgroundColor
                                            );
                                        }
                                        if (props.borderRadius !== undefined) {
                                            document.documentElement.style.setProperty(
                                                '--editor-border-radius',
                                                props.borderRadius
                                            );
                                        }
                                        if (
                                            props.showScrollbars !== undefined
                                        ) {
                                            document.documentElement.style.setProperty(
                                                '--editor-overflow',
                                                props.showScrollbars
                                                    ? 'auto'
                                                    : 'hidden'
                                            );
                                            document.documentElement.style.setProperty(
                                                '--scrollbar-width',
                                                props.showScrollbars
                                                    ? '8px'
                                                    : '0'
                                            );
                                            document.documentElement.style.setProperty(
                                                '--scrollbar-display',
                                                props.showScrollbars
                                                    ? 'block'
                                                    : 'none'
                                            );
                                        }
                                        if (props.showToolbar !== undefined) {
                                            document.documentElement.style.setProperty(
                                                '--editor-toolbar-display',
                                                props.showToolbar
                                                    ? 'block'
                                                    : 'none'
                                            );
                                            document.documentElement.style.setProperty(
                                                '--editor-toolbar-height',
                                                props.showToolbar
                                                    ? '40px'
                                                    : '0px'
                                            );
                                        }
                                        if (props.placeholder !== undefined) {
                                            quill.root.dataset.placeholder =
                                                props.placeholder;
                                        }
                                        if (props.theme !== undefined) {
                                            const colors =
                                                props.theme.colors || {};
                                            Object.entries(colors).forEach(
                                                ([key, value]) => {
                                                    document.documentElement.style.setProperty(
                                                        '--' + key,
                                                        value
                                                    );
                                                }
                                            );
                                            if (
                                                props.backgroundColor ===
                                                    undefined &&
                                                colors.SecondaryBackground
                                            ) {
                                                document.documentElement.style.setProperty(
                                                    '--editor-bg-color',
                                                    colors.SecondaryBackground
                                                );
                                            }
                                        }
                                        break;
                                    default:
                                        break;
                                }
                            } catch (err) {
                                console.error(
                                    'Error handling message in Quill iframe:',
                                    err
                                );
                            }
                        });

                        quill.clipboard.addMatcher(
                            'span',
                            function (node, delta) {
                                if (
                                    node.classList &&
                                    node.classList.contains('spoiler')
                                ) {
                                    delta.ops.forEach((op) => {
                                        op.attributes = op.attributes || {};
                                        op.attributes.spoiler = true;
                                    });
                                }
                                return delta;
                            }
                        );

                        function strikeMatcher(node, delta) {
                            const tag =
                                node.tagName && node.tagName.toLowerCase();
                            if (tag === 'del' || tag === 's') {
                                delta.ops.forEach((op) => {
                                    op.attributes = op.attributes || {};
                                    op.attributes.strike = true;
                                });
                            }
                            return delta;
                        }
                        quill.clipboard.addMatcher('del', strikeMatcher);
                        quill.clipboard.addMatcher('s', strikeMatcher);

                        const initialHTML = ${JSON.stringify(initialHTML)};
                        if (initialHTML) {
                            const delta = quill.clipboard.convert(initialHTML);
                            quill.setContents(delta, 'silent');
                        }

                        quill.root.addEventListener('focus', function () {
                            postMessageFn(
                                JSON.stringify({
                                    type: 'focus',
                                    message: 'Editor focused',
                                })
                            );
                        });

                        quill.on('text-change', function () {
                            const delta = quill.getContents();
                            postMessageFn(
                                JSON.stringify({
                                    type: 'text-change',
                                    delta: delta,
                                })
                            );
                        });

                        postMessageFn(
                            JSON.stringify({
                                type: 'iframe-init',
                                message: 'Quill editor loaded',
                            })
                        );

                        function postMessageFn(msg) {
                            if (
                                window.ReactNativeWebView &&
                                window.ReactNativeWebView.postMessage
                            ) {
                                window.ReactNativeWebView.postMessage(msg);
                            } else if (
                                window.parent &&
                                window.parent.postMessage
                            ) {
                                window.parent.postMessage(msg, '*');
                            }
                        }

                        if (window.ResizeObserver) {
                            const ro = new ResizeObserver((entries) => {
                                for (const { contentRect } of entries) {
                                    postMessageFn(
                                        JSON.stringify({
                                            type: 'content-height',
                                            height: Math.ceil(
                                                contentRect.height
                                            ),
                                        })
                                    );
                                }
                            });
                            ro.observe(quill.root);
                        }
                    }

                    document.addEventListener('DOMContentLoaded', function () {
                        if (typeof initQuill === 'function') {
                            initQuill();
                        } else {
                            console.error('initQuill function is not defined.');
                        }
                    });
                </script>
            </body>
        </html>`;
}
