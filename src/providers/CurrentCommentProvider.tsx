import React, { createContext, useState, FC, useMemo } from 'react';

export type CurrentCommentContextType = {
    parentUser: string;
    setParentUser: (parentUser: string) => void;
    parentContent: string;
    setParentContent: (parentContent: string) => void;
    parentDate: string;
    setParentDate: (parentDate: string) => void;
};

const defaultContext: CurrentCommentContextType = {
    parentUser: '',
    setParentUser: () => {},
    parentContent: '',
    setParentContent: () => {},
    parentDate: '',
    setParentDate: () => {},
};

export const CurrentCommentContext =
    createContext<CurrentCommentContextType>(defaultContext);

export const CurrentCommentProvider: FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [parentUser, setParentUser] = useState<string>('');
    const [parentContent, setParentContent] = useState<string>('');
    const [parentDate, setParentDate] = useState<string>('');

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
        ]
    );
};
