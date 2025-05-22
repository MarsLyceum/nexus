// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable unicorn/prefer-module */
// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable global-require */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const setItem = async (key: string, value: string): Promise<void> => {
    await (Platform.OS === 'web'
        ? AsyncStorage.setItem(key, value)
        : setItemSecure(key, value));
};

export const getItem = (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
        return AsyncStorage.getItem(key);
    }
    return getItemSecure(key);
};

export const deleteItem = (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
        return AsyncStorage.removeItem(key);
    }
    return deleteItemSecure(key);
};

export const setItemSecure = async (
    key: string,
    value: string
): Promise<void> => {
    const SecureStore = require('expo-secure-store');
    await SecureStore.setItemAsync(key, value);
};

export const getItemSecure = (key: string): Promise<string | null> => {
    const SecureStore = require('expo-secure-store');
    return SecureStore.getItemAsync(key);
};

export const deleteItemSecure = (key: string): Promise<void> => {
    const SecureStore = require('expo-secure-store');
    return SecureStore.deleteItemAsync(key);
};
