export const getRelativeTime = (postedDate: string | Date): string => {
    const diff = Date.now() - new Date(postedDate).getTime();

    const minutes = Math.round(diff / (1000 * 60));
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.round(hours / 24);
    if (days < 7) return `${days}d`;
    const weeks = Math.round(days / 7);
    if (weeks < 4) return `${weeks}w`;
    const months = Math.round(days / 30);
    if (months < 12) return `${months}mo`;
    const years = Math.round(days / 365);
    return `${years}y`;
};
