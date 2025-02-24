import { deltaToMarkdown } from 'quill-delta-to-markdown';

export function convertDeltaToMarkdownWithFencesAndFormatting(
    ops: any[]
): string {
    const segments: { isCode: boolean; ops: any[] }[] = [];
    let currentSegment: { isCode: boolean; ops: any[] } | null = null;

    // Split operations into segments based on whether they are code or non-code.
    for (let i = 0; i < ops.length; i++) {
        const op = ops[i];
        let opIsCode = false;
        if (op.attributes && op.attributes['code-block']) {
            opIsCode = true;
        } else if (
            i + 1 < ops.length &&
            ops[i + 1].insert === '\n' &&
            ops[i + 1].attributes &&
            ops[i + 1].attributes['code-block']
        ) {
            opIsCode = true;
        }
        if (!currentSegment) {
            currentSegment = { isCode: opIsCode, ops: [op] };
        } else if (currentSegment.isCode === opIsCode) {
            currentSegment.ops.push(op);
        } else {
            segments.push(currentSegment);
            currentSegment = { isCode: opIsCode, ops: [op] };
        }
    }
    if (currentSegment) {
        segments.push(currentSegment);
    }

    let markdown = '';
    segments.forEach((segment) => {
        if (segment.isCode) {
            // Wrap code blocks with triple backticks.
            const codeText = segment.ops.map((op) => op.insert).join('');
            markdown += `\n\`\`\`\n${codeText}\n\`\`\`\n`;
        } else {
            // Pre-process non-code ops to wrap spoiler and strike text with Markdown markers.
            const processedOps = segment.ops.map((op) => {
                let newInsert = op.insert;
                // Copy attributes if they exist.
                let newAttributes = op.attributes ? { ...op.attributes } : {};

                // If op has a spoiler attribute, wrap the text with Discord-style spoiler markers.
                if (newAttributes.spoiler) {
                    newInsert = `||${newInsert}||`;
                    newAttributes.spoiler = undefined;
                }
                // If op has a strike attribute, wrap the text with Markdown strike-through markers.
                if (newAttributes.strike) {
                    newInsert = `~~${newInsert}~~`;
                    newAttributes.strike = undefined;
                }
                return {
                    ...op,
                    insert: newInsert,
                    attributes: newAttributes,
                };
            });
            const nonCodeMarkdown = deltaToMarkdown(processedOps);
            markdown += nonCodeMarkdown;
        }
    });
    return markdown;
}
