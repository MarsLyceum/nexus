export type Attachment = {
    id: string;
    previewUri: string;
    file: File | { uri: string; type: string; name: string };
};
