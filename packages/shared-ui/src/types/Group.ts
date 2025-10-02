// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-use-before-define */

export type TextChannelMessage = {
    id: string;
    content: string;
    postedAt: Date;
    edited: boolean;
    channel?: GroupChannel;
    channelId: string;
    postedByUserId: string;
    attachmentUrls?: string[];
    isDraft?: boolean;
};

export type FeedChannelPost = {
    id: string;
    content: string;
    postedAt: Date;
    edited: boolean;
    channel?: GroupChannel;
    channelId: string;
    postedByUserId: string;
    attachmentUrls?: string[];

    title: string;
    flair?: string;
    domain?: string;
    thumbnail?: string;
    upvotes: number;
    commentsCount: number;
    shareCount: number;
};

export type FeedChannelPostComment = {
    id: string;
    content: string;
    postedAt: Date;
    edited: boolean;
    postedByUserId: string;
    postId: string;
    parentCommentId?: string | null;
    children?: FeedChannelPostComment[];
    upvotes: number;
    attachmentUrls?: string[];
};

export type GroupRole = 'owner' | 'admin' | 'moderator' | 'member';
export type ChannelType = 'text' | 'voice' | 'feed';

export type GroupMember = {
    userId: string;
    groupId: string;
    role: GroupRole;
    joinedAt: Date;
    group: Group;
};

export type GroupChannel = {
    id: string;
    name: string;
    type: ChannelType;
    createdAt: Date;
    groupId: string;
    group: Group;
    orderIndex: number;
};

export type Group = {
    id: string;
    name: string;
    createdByUserId: string;
    createdAt: Date;
    members: GroupMember[];
    channels: GroupChannel[];
    description?: string;
    avatarUrl?: string;
    publicGroup?: boolean;
};
