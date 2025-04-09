import { GroupChannelRegularMessage } from './Group';
import { Message } from './DirectMessages';

export type MessageWithAvatar = GroupChannelRegularMessage & {
    avatar: string;
    username: string;
};

export type DirectMessageWithAvatar = Message & {
    avatar: string;
    username: string;
};
