// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable global-require */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const setItem = async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
        await AsyncStorage.setItem(key, value);
    } else {
        const SecureStore = require('expo-secure-store');
        await SecureStore.setItemAsync(key, value);
    }
};

export const getItem = (key: string): Promise<string> => {
    if (Platform.OS === 'web') {
        return AsyncStorage.getItem(key);
    }
    const SecureStore = require('expo-secure-store');
    return SecureStore.getItemAsync(key);
};

export const deleteItem = (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
        return AsyncStorage.removeItem(key);
    }
    const SecureStore = require('expo-secure-store');
    return SecureStore.deleteItemAsync(key);
};
