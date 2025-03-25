// ActiveGroupContext.tsx
import React, { createContext, useState, FC, ReactNode } from 'react';
import { Group, GroupChannel } from '../types';

// Define the shape of our context value.
interface ActiveGroupContextType {
    activeGroup: Group | undefined;
    setActiveGroup: (group: Group) => void;
    activeChannel: GroupChannel | undefined;
    setActiveChannel: (channel: GroupChannel | undefined) => void;
}

// Create the context with a default value.
// The default setters are no-ops.
export const ActiveGroupContext = createContext<ActiveGroupContextType>({
    activeGroup: undefined,
    setActiveGroup: () => {},
    activeChannel: undefined,
    setActiveChannel: () => {},
});

// Define the props for our provider.
interface ActiveGroupProviderProps {
    children: ReactNode;
}

// Create the provider component that wraps your app (or part of your app)
// to supply the active group and active channel context.
export const ActiveGroupProvider: FC<ActiveGroupProviderProps> = ({
    children,
}) => {
    const [activeGroup, setActiveGroup] = useState<Group | undefined>();
    const [activeChannel, setActiveChannel] = useState<
        GroupChannel | undefined
    >();

    return (
        <ActiveGroupContext.Provider
            value={{
                activeGroup,
                setActiveGroup,
                activeChannel,
                setActiveChannel,
            }}
        >
            {children}
        </ActiveGroupContext.Provider>
    );
};
