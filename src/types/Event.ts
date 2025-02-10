export type Event = {
    id: string;
    title: string;
    dateTime: string;
    groupName: string;
    attendees: number;
    location: string;
    imageUrl: string;
    postedByUser: {
        username?: string;
    };
};
