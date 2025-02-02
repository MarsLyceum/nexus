import { Group } from './Group';

export type User = {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    token: string;
    groups: [Group] | [];
};
