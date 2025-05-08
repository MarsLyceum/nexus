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

export const USER_KEY = 'user';
export const ACCESS_TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const REFRESH_TOKEN_EXPIRES_AT_KEY = 'refresh_token_expires_at';

export * from './colors';
