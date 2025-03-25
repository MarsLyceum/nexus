import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const setItem = async (key: string, value: string) => {
    // eslint-disable-next-line unicorn/prefer-ternary
    if (Platform.OS === 'web') {
        await AsyncStorage.setItem(key, value);
    } else {
        await SecureStore.setItemAsync(key, value.toString()); // v must be string,
    }
};

export const getItem = (key: string) => {
    // eslint-disable-next-line unicorn/prefer-ternary
    if (Platform.OS === 'web') {
        return AsyncStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
};

export const deleteItem = (key: string) => {
    // eslint-disable-next-line unicorn/prefer-ternary
    if (Platform.OS === 'web') {
        return AsyncStorage.removeItem(key);
    }
    return SecureStore.deleteItemAsync(key);
};
