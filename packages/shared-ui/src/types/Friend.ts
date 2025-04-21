export type Friend = {
    id?: string;
    email?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    status?: string;
};

export type FriendItemData = {
    friend: Friend;
    id: string;
    // This is the relationship status (accepted, pending, blocked, etc.)
    status?: string;
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
