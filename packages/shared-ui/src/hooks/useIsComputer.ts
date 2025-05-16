import { useState, useEffect } from 'react';
import { Platform, Dimensions } from 'react-native';
import { isComputer } from '../utils';

/**
 * React hook that returns the latest `isComputer()` value,
 * updating when the viewport size or orientation changes (web & native).
 */
export const useIsComputer = (): boolean => {
    // seed state with the current util value
    const [computer, setComputer] = useState(() => isComputer());

    useEffect(() => {
        // handler reads directly from your existing util
        const update = () => {
            setComputer(isComputer());
            // eslint-disable-next-line no-console
            console.log('[useIsComputer] rechecked →', isComputer());
        };

        if (Platform.OS === 'web') {
            // on web, listen to window resize
            window.addEventListener('resize', update);
            return () => window.removeEventListener('resize', update);
        }

        // on native, listen to dimension/orientation changes
        const sub = Dimensions.addEventListener('change', update);
        return () => sub.remove();
    }, []);

    return computer;
};
