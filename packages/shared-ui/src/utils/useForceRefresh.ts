import { useCallback } from 'react';
import { Platform, DevSettings } from 'react-native';

import * as Updates from 'expo-updates';

export const useForceRefresh = () =>
    useCallback(() => {
        if (Platform.OS === 'web') {
            globalThis.location.reload();
            return;
        }

        const reloadNative = () => {
            DevSettings.reload();
        };

        if (__DEV__) {
            reloadNative();
            return;
        }

        Updates.reloadAsync().catch(reloadNative);
    }, []);
