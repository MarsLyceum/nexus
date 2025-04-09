// Helper to strip HTML tags from a string.
export const stripHtml = (html: string): string =>
    html.replaceAll(/<[^>]+>/g, '').trim();
