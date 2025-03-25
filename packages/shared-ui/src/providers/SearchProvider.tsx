// context/SearchContext.tsx
import React, { createContext, useState, FC, ReactNode } from 'react';

// Define the shape of our context's value
export interface SearchContextType {
    searchText: string;
    setSearchText: (text: string) => void;
}

// Create the context with default values
export const SearchContext = createContext<SearchContextType>({
    searchText: '',
    setSearchText: () => {},
});

// Define the provider's props
interface SearchProviderProps {
    children: ReactNode;
}

// Create the provider component
export const SearchProvider: FC<SearchProviderProps> = ({ children }) => {
    const [searchText, setSearchText] = useState('');

    return (
        <SearchContext.Provider value={{ searchText, setSearchText }}>
            {children}
        </SearchContext.Provider>
    );
};
