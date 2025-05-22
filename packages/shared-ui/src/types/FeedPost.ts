export type FeedPost = {
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
    attachmentUrls?: string[];
};

export type Post = {
    id: string;
    user?: string;
    time?: string;
    title: string;
    flair?: string;
    upvotes: number;
    commentsCount: number;
    content: string;
    postedByUserId?: string;
    postedAt?: string;
    attachmentUrls?: string[];
};

export type PostData = {
    id: string;
    user: string;
    time: string;
    title: string;
    flair: string;
    upvotes: number;
    commentsCount: number;
    content: string;
    attachmentUrls: string[];
};
