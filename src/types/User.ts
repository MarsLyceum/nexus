import { Group } from './Group';

export type User = {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    token: string;
    groups: [Group] | [];
    status: 'online' | 'offline' | 'idle' | 'offline_dnd' | 'online_dnd';
};
