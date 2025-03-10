// utils/linkPreviewUtils.ts

export function isImageExtensionUrl(url: string): boolean {
    const regex = /\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i;
    return regex.test(url);
}

export async function isImageUrl(url: string): Promise<boolean> {
    if (isImageExtensionUrl(url)) {
        return true;
    }
    try {
        const response = await fetch(url, { method: 'HEAD' });
        const contentType = response.headers.get('Content-Type');
        return Boolean(contentType && contentType.startsWith('image/'));
    } catch (error) {
        console.error('HEAD request failed:', error);
        return false;
    }
}

export function getDomainFromUrl(url: string): string {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.hostname;
    } catch {
        return url;
    }
}

// eslint-disable-next-line consistent-return
export function getOEmbedEndpoint(url: string): string | undefined {
    const domain = getDomainFromUrl(url).toLowerCase();
    if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
        return `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    }
    if (domain.includes('twitter.com')) {
        return `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`;
    }
    if (domain.includes('instagram.com')) {
        return `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}`;
    }
    if (domain.includes('facebook.com')) {
        return `https://www.facebook.com/plugins/post/oembed.json/?url=${encodeURIComponent(url)}`;
    }
    if (domain.includes('vimeo.com')) {
        return `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
    }
    if (domain.includes('soundcloud.com')) {
        return `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    }
    if (domain.includes('open.spotify.com')) {
        return `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    }
    if (domain.includes('flickr.com')) {
        return `https://www.flickr.com/services/oembed/?url=${encodeURIComponent(url)}&format=json`;
    }
    if (domain.includes('imgur.com')) {
        return `https://api.imgur.com/oembed.json?url=${encodeURIComponent(url)}`;
    }
    if (domain.includes('giphy.com')) {
        return `https://giphy.com/services/oembed?url=${encodeURIComponent(url)}&format=json`;
    }
}
