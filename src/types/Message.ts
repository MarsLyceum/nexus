import { GroupChannelMessage } from './Group';

export type MessageWithAvatar = GroupChannelMessage & {
    avatar: string;
    username: string;
    attachmentUrls?: string[];
};
