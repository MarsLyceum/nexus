import { ExpoConfig } from '@expo/config-types';

const config: ExpoConfig = {
    name: 'peeps',
    slug: 'peeps',
    version: '1.0.1',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
        image: './assets/splash.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
        supportsTablet: true,
        infoPlist: {
            NSLocationWhenInUseUsageDescription:
                'We need your location to provide better services.',
            NSLocationAlwaysUsageDescription:
                'We need your location to provide better services.',
        },
    },
    android: {
        adaptiveIcon: {
            foregroundImage: './assets/adaptive-icon.png',
            backgroundColor: '#ffffff',
        },
        package: 'com.marslyceum.peeps',
        permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
    },
    web: {
        favicon: './assets/favicon.png',
    },
    extra: {
        eas: {
            projectId: '453de580-4e9c-47b1-8976-f5d2fdd9a557',
        },
    },
    platforms: ['ios', 'android', 'web'],
    plugins: ['expo-font'],
};

export default config;
