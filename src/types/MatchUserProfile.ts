export type MatchUserProfile = {
    id: string;
    firstName: string;
    lastName: string;
    age: number;
    profession: string;
    location: {
        city: string;
        state: string;
        country: string;
        address: string;
    };
    about: string;
    interests: string[];
    /** array of image URLs */
    gallery: string[];
};
