import { GroupChannel } from './Group';

export type FeedPost = {
    id: string;
    username: string;
    postedByUserId: string;
    postedAt: Date;
    channelId: string;
    channel?: GroupChannel;
    group?: string;
    domain: string;
    title: string;
    upvotes: number;
    commentsCount: number;
    shareCount: number;
    content: string;
    time: string;
    thumbnail: string;
    attachmentUrls?: string[];
    flair?: string;
    edited: boolean;
};

export type Post = {
    id: string;
    username?: string;
    channelId: string;
    edited: boolean;
    time?: string;
    title: string;
    flair?: string;
    upvotes: number;
    commentsCount: number;
    content: string;
    postedByUserId: string;
    postedAt?: string;
    attachmentUrls?: string[];
    domain: string;
    shareCount: number;
    thumbnail: string;
};
