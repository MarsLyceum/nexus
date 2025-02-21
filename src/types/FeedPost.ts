export interface FeedPost {
    id: string;
    user: string;
    domain: string;
    title: string;
    upvotes: number;
    commentsCount: number;
    shareCount: number;
    content: string;
    time: string;
    thumbnail: string;
    fromReddit?: boolean;
    attachmentUrls?: string[];
}
