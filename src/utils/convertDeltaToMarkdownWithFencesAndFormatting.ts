import { deltaToMarkdown } from 'quill-delta-to-markdown';

export function convertDeltaToMarkdownWithFencesAndFormatting(
    ops: any[]
): string {
    const segments: { isCode: boolean; ops: any[] }[] = [];
    let currentSegment: { isCode: boolean; ops: any[] } | null = null;

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
            const nonCodeMarkdown = deltaToMarkdown(segment.ops);
            markdown += nonCodeMarkdown;
        }
    });
    return markdown;
}
