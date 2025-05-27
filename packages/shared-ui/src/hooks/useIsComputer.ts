import { useState, useEffect } from 'react';
import { Platform, Dimensions } from 'react-native';
import { isComputer as isComputerUtil, getSafeWindow } from '../utils';

/**
 * React hook that returns the latest `isComputer()` value,
 * updating when the viewport size or orientation changes (web & native).
 */
export const useIsComputer = (): boolean => {
    // seed state with the current util value
    const [isComputer, setIsComputer] = useState(() => isComputerUtil());

    useEffect(() => {
        const update = () => {
            setIsComputer(isComputerUtil());
        };
        const safeWindow = getSafeWindow();

        if (Platform.OS === 'web' && safeWindow) {
            // on web, listen to window resize
            safeWindow.addEventListener('resize', update);
            return () => safeWindow.removeEventListener('resize', update);
        }

        // on native, listen to dimension/orientation changes
        const sub = Dimensions.addEventListener('change', update);
        return () => sub.remove();
    }, []);

    return isComputer;
};
