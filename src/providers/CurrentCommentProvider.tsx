import React, { createContext, useState, FC, useMemo } from 'react';

export type CurrentCommentContextType = {
    parentUser: string;
    setParentUser: (parentUser: string) => void;
    parentContent: string;
    setParentContent: (parentContent: string) => void;
    parentAttachmentUrls: string[];
    setParentAttachmentUrls: (parentAttachments: string[]) => void;
    parentDate: string;
    setParentDate: (parentDate: string) => void;
    postId: string;
    setPostId: (postId: string) => void;
    parentCommentId: string | null;
    setParentCommentId: (parentCommentId: string | null) => void;
};

const defaultContext: CurrentCommentContextType = {
    parentUser: '',
    setParentUser: () => {},
    parentContent: '',
    setParentContent: () => {},
    parentAttachmentUrls: [],
    setParentAttachmentUrls: () => {},
    parentDate: '',
    setParentDate: () => {},
    postId: '',
    setPostId: () => {},
    parentCommentId: '',
    setParentCommentId: () => {},
};

export const CurrentCommentContext =
    createContext<CurrentCommentContextType>(defaultContext);

export const CurrentCommentProvider: FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [parentUser, setParentUser] = useState<string>('');
    const [parentContent, setParentContent] = useState<string>('');
    const [parentAttachmentUrls, setParentAttachmentUrls] = useState<string[]>(
        []
    );
    const [parentDate, setParentDate] = useState<string>('');
    const [postId, setPostId] = useState<string>('');
    // eslint-disable-next-line unicorn/no-null
    const [parentCommentId, setParentCommentId] = useState<string | null>(null);

    return useMemo(
        () => (
            <CurrentCommentContext.Provider
                value={{
                    parentUser,
                    setParentUser,
                    parentContent,
                    setParentContent,
                    parentDate,
                    setParentDate,
                    postId,
                    setPostId,
                    parentCommentId,
                    setParentCommentId,
                    parentAttachmentUrls,
                    setParentAttachmentUrls,
                }}
            >
                {children}
            </CurrentCommentContext.Provider>
        ),
        [
            parentUser,
            setParentUser,
            parentContent,
            setParentContent,
            parentDate,
            setParentDate,
            postId,
            setPostId,
            parentCommentId,
            setParentCommentId,
            parentAttachmentUrls,
            setParentAttachmentUrls,
            children,
        ]
    );
};
