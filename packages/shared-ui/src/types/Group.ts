export type TextChannelMessage = {
    id: string;
    content: string;
    postedAt: Date;
    edited: boolean;
    // eslint-disable-next-line no-use-before-define
    channel?: GroupChannel;
    channelId: string;
    postedByUserId: string;
    attachmentUrls?: string[];
};

export type FeedChannelPost = {
    id: string;
    content: string;
    postedAt: Date;
    edited: boolean;
    // eslint-disable-next-line no-use-before-define
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

// New type for post comments (reflecting GroupChannelPostCommentEntity)
export type GroupChannelPostComment = {
    id: string;
    content: string;
    postedAt: Date;
    edited: boolean;
    postedByUserId: string;
    // Reference to the parent post (FeedChannelPost)
    postId: string;
    // For threaded replies, optional parent comment id
    parentCommentId?: string | null;
    // Nested replies
    children?: GroupChannelPostComment[];
    upvotes: number;
};

export type GroupRole = 'owner' | 'admin' | 'moderator' | 'member';
export type ChannelType = 'text' | 'voice' | 'feed';

export type GroupMember = {
    userId: string;
    groupId: string;
    role: GroupRole;
    joinedAt: Date;
    // eslint-disable-next-line no-use-before-define
    group: Group;
};

export type GroupChannel = {
    id: string;
    name: string;
    type: ChannelType;
    createdAt: Date;
    groupId: string;
    // eslint-disable-next-line no-use-before-define
    group: Group;
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
};
