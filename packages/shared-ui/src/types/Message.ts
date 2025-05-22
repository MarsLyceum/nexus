import { TextChannelMessage } from './Group';
import { Message } from './DirectMessages';

export type MessageWithAvatar = TextChannelMessage & {
    avatar: string;
    username: string;
};

export type DirectMessageWithAvatar = Message & {
    avatar: string;
    username: string;
};
