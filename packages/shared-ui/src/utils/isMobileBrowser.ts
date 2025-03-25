import { Platform } from 'react-native';

// Helper function to determine if the web browser is running on a mobile device
export const isMobileBrowser = (): boolean => {
    if (Platform.OS !== 'web') {
        // If not on web, then it's a native mobile app (iOS/Android) or desktop app.
        return false;
    }
    // When running on the web, check for mobile characteristics.
    // Option 1: Use the user agent to detect mobile devices
    const userAgent = window.navigator.userAgent || '';
    const isUserAgentMobile = /mobi|android/i.test(userAgent);

    // Option 2 (optional): Check the screen width as a fallback (you can adjust the breakpoint as needed)
    const isNarrowScreen = window.innerWidth < 768;

    return isUserAgentMobile || isNarrowScreen;
};
