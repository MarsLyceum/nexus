// Helper to extract URLs from text using a refined regex.
export const extractUrls = (text: string): string[] => {
    const urlRegex = /https?:\/\/[^\s"<]+/g;
    const matches = text.match(urlRegex);
    return matches || [];
};
