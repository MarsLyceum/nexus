export type Message = {
    id: string;
    content: string;
    senderUserId: string;
    createdAt: string;
    edited: boolean;
    attachmentUrls?: string[];
};

// Conversation type coming from the GraphQL query.
export type Conversation = {
    id: string;
    type: string;
    participantsUserIds: string[];
    messages: Message[];
    channelId: string;
};
