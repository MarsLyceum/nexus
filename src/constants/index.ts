import { Platform } from 'react-native';

function getPlatformTopPadding() {
    if (Platform.OS === 'android') {
        return 30;
    }
    return 0;
}

export const PLATFORM_TOP_PADDING = getPlatformTopPadding();
export const GIPHY_API_KEY = 'x7H5rEtEkVkLocnLJsmZoLPBaGbMdEqC';
export const SIDEBAR_WIDTH = 200;

export * from './colors';
