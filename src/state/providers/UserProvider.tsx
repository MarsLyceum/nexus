import React, { createContext, useContext, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { User } from '../../types';

const TOKEN_KEY = 'userToken';

interface UserContextProps {
    user: User | undefined;
    setUser: (user: User | undefined) => void;
    loginUser: (user: User) => Promise<void>;
    logoutUser: () => Promise<void>;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | undefined>(undefined);

    const loginUser = async (user: User) => {
        try {
            await SecureStore.setItemAsync(TOKEN_KEY, user.token);
            setUser(user);
        } catch (error) {
            console.error('Error storing the token', error);
        }
    };

    const logoutUser = async () => {
        try {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            setUser(undefined);
        } catch (error) {
            console.error('Error removing the token', error);
        }
    };

    return (
        <UserContext.Provider value={{ user, setUser, loginUser, logoutUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
