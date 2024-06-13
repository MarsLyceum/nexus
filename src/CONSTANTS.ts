import { Platform } from 'react-native';

function getPlatformTopPadding() {
    if (Platform.OS === 'android') {
        return 30;
    }
    return 0;
}

export const PLATFORM_TOP_PADDING = getPlatformTopPadding();
export const GEOCODING_ENABLED = false;
