import { extractUrls } from './extractUrls';

// escape any regex‐special chars in the URL so our dynamic RegExps stay safe
function escapeRegExp(value: string): string {
    return value.replaceAll(/[-/\\^$*+?.()|[\]{}]/g, String.raw`\$&`);
}

/**
 * Returns true if `content` is exactly one of:
 *  • a plain URL
 *  • a Markdown link:  [text](url)
 *  • a Markdown image: ![alt](url)
 */
export function isJustLink(content: string): boolean {
    const trimmed = content.trim();
    const urls = extractUrls(trimmed);
    if (urls.length !== 1) return false;

    const [url] = urls;
    const escaped = escapeRegExp(url);

    // 1) plain URL
    if (trimmed === url) return true;

    // 2) Markdown link:   [label](url)
    const linkRe = new RegExp(`^\\[[^\\]]+]\\(\\s*${escaped}\\s*\\)$`);

    // 3) Markdown image:  ![alt](url)
    const imageRe = new RegExp(`^!\\[[^\\]]*]\\(\\s*${escaped}\\s*\\)$`);

    return linkRe.test(trimmed) || imageRe.test(trimmed);
}
