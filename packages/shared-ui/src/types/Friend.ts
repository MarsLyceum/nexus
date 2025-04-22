export type Friend = {
    id?: string;
    email?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    status?:
        | 'online'
        | 'online_dnd'
        | 'idle'
        | 'offline'
        | 'invisible'
        | 'offline_dnd';
};

export type FriendItemData = {
    friend: Friend;
    id: string;
    // This is the relationship status (accepted, pending, blocked, etc.)
    status?: 'accepted' | 'pending' | 'blocked';
    requestedBy?: {
        id: string;
        email: string;
        username: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        status: string;
    } | null;
};
