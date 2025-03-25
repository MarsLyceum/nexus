export type AttachmentFile = File | { uri: string; type: string; name: string };

export type Attachment = {
    id: string;
    previewUri: string;
    file: AttachmentFile;
};
