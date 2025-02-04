export type GroupRole = 'owner' | 'admin' | 'moderator' | 'member';

export type GroupMember = {
    userEmail: string;
    groupId: string;
    role: GroupRole;
    joinedAt: Date;
};

export type GroupChannelMessage = {
    id: string;
    content: string;
    postedAt: Date;
    edited: boolean;
    channel: GroupChannel;
    channelId: string;
    postedByUserId: string;
};

export type GroupChannel = {
    id: string;
    name: string;
    type: 'text' | 'voice' | 'feed';
    createdAt: Date;
    groupId: string;
    messages: GroupChannelMessage[];
};

export type Group = {
    id: string;
    name: string;
    createdByUserEmail: string;
    createdAt: Date;
    members: GroupMember[];
    channels: GroupChannel[];
    description?: string;
    avatarFilePath?: string;
};
